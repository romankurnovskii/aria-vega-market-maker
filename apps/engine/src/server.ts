/**
 * @file server.ts
 * @description Express HTTP server: exposes REST endpoints for monitoring and control.
 *
 * @features
 * - GET /assignments — list all persistent assignments
 * - POST /assignments — create and register a new assignment (persists + registers orchestrator)
 * - DELETE /assignments/:id — delete assignment and deregister orchestrator
 * - POST /strategies/:id/evaluate — ad-hoc strategy evaluation for a given position
 * - GET /health — liveness probe returning timestamp
 *
 * @dependencies express, cors, IStore, IOrchestratorRegistry, IExecutor, OrchestratorFactory, IPositionProvider (from @lp-system/core)
 * @sideEffects Mutates persistent store (assignments.json) and in-memory registry on POST/DELETE
 */
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import {
  IStore,
  IOrchestratorRegistry,
  IExecutor,
  IPositionProvider,
  IPositionStore,
  Position,
  PoolInfo,
  MarketSnapshot,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import { getPriceFromBinId } from '@lp-system/providers';
import {
  createAssignmentsRouter,
  createIntrospectionRouter,
  handlePositionsRouter,
  createWalletsRouter,
} from './routes/index.js';

const logger = getLogger('server');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Starts the HTTP control plane server.
 *
 * @param {IStore} store - Persistent assignment and execution record store.
 * @param {IOrchestratorRegistry} registry - In-memory orchestrator registry (mutated on POST/DELETE).
 * @param {IExecutor} executor - Transaction executor.
 * @param {OrchestratorFactory} factory - Creates orchestrators for new assignments.
 * @param {IPositionProvider} positionProvider - On-chain data source for ad-hoc evaluation.
 * @param {string} walletAddress - Active wallet address.
 * @param {IPositionStore} [positionStore] - Optional persistent position cache containing active/failed states.
 * @returns {express.Application} Configured Express app instance (also starts listening).
 */
export function startHttpServer(
  store: IStore,
  registry: IOrchestratorRegistry,
  executor: IExecutor,
  factory: OrchestratorFactory,
  positionProvider: IPositionProvider,
  walletAddress: string,
  positionStore?: IPositionStore
): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  app.use('/assignments', createAssignmentsRouter(store, registry, factory));
  app.use('/', createIntrospectionRouter(factory));
  app.use('/wallets', createWalletsRouter(positionProvider));
  app.get('/positions', async (req, res) => {
    try {
      const targetWallet = (req.query.wallet as string) || walletAddress;

      const isDefaultWallet = targetWallet === walletAddress;

      let positions: Position[];
      let livePositions: Position[];

      if (isDefaultWallet && positionStore) {
        // Use cache for default wallet, fetch live only for PnL enrichment
        positions = await positionStore.getKnown();
        livePositions = await positionProvider.getPositions(targetWallet).catch(() => []);
      } else {
        // Fetch live for non-default wallets (positionStore cache only covers default)
        positions = await positionProvider.getPositions(targetWallet);
        livePositions = positions;
      }

      // Batch fetch pool metadata and market snapshots to avoid N+1 redundancy
      const uniquePools = [...new Set(positions.map((p) => p.poolAddress))];
      const poolDataMap = new Map<string, { poolInfo: PoolInfo; market: MarketSnapshot }>();

      await Promise.all(
        uniquePools.map(async (poolAddress) => {
          try {
            const [poolInfo, market] = await Promise.all([
              positionProvider.getPoolInfo(poolAddress),
              positionProvider.getMarketSnapshot(poolAddress),
            ]);
            poolDataMap.set(poolAddress, { poolInfo, market });
          } catch (e) {
            logger.warn(`Failed to fetch metadata for pool ${poolAddress}: ${e}`);
          }
        })
      );

      // Enrich positions with price/range data using the batched metadata
      const positionsWithPriceData = positions.map((pos) => {
        try {
          const poolData = poolDataMap.get(pos.poolAddress);
          if (!poolData) {
            return pos;
          }

          const { poolInfo, market } = poolData;

          const lowerBoundPrice = getPriceFromBinId(
            pos.lowerBound,
            poolInfo.binStep,
            pos.tokenX.decimals,
            pos.tokenY.decimals
          );
          const upperBoundPrice = getPriceFromBinId(
            pos.upperBound,
            poolInfo.binStep,
            pos.tokenX.decimals,
            pos.tokenY.decimals
          );

          const binCount = pos.upperBound - pos.lowerBound + 1;
          const rangePercent = lowerBoundPrice > 0 ? ((upperBoundPrice - lowerBoundPrice) / lowerBoundPrice) * 100 : 0;

          const livePnl = livePositions.find((lp) => lp.id === pos.id)?.pnlData || pos.pnlData;

          return {
            ...pos,
            lowerBoundPrice,
            upperBoundPrice,
            activeBin: market.activeBound,
            binCount,
            rangePercent,
            poolActivePrice: market.price,
            binStep: poolInfo.binStep,
            feeRate: poolInfo.feeRate,
            pnlData: livePnl,
          };
        } catch (e) {
          logger.warn(`Failed to enrich position ${pos.id} with price data: ${e}`);
          return pos;
        }
      });

      res.json({
        wallet: targetWallet,
        count: positionsWithPriceData.length,
        positions: positionsWithPriceData,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get(['/positions/history', '/positions/closed'], async (_req, res) => {
    try {
      let positions: Position[] = [];
      if (positionStore) {
        positions = await positionStore.getArchived();
      }
      res.json({
        wallet: walletAddress,
        count: positions.length,
        positions,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.use('/positions', handlePositionsRouter(positionProvider, executor, registry, factory, store));

  const swaggerDocument = YAML.load(path.join(__dirname, '../src/openapi.yaml'));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  app.listen(PORT, () => {
    logger.info(`[HTTP Server] Operational and listening on port ${PORT} (loaded: ${executor.constructor.name})`);
  });

  return app;
}
