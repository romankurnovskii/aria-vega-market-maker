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

import { IStore, IOrchestratorRegistry, IExecutor, IPositionProvider, IPositionStore, Position } from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import { createAssignmentsRouter, createStrategiesRouter, createIntrospectionRouter } from './routes/index.js';
import { getPriceFromBinId } from '@lp-system/providers';

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
  app.use('/strategies', createStrategiesRouter(registry, positionProvider));
  app.use('/', createIntrospectionRouter(factory));

  app.get('/positions', async (_req, res) => {
    try {
      let positions: Position[];
      if (positionStore) {
        positions = await positionStore.getKnown();
      } else {
        positions = await positionProvider.getPositions(walletAddress);
      }

      const livePositions = await positionProvider.getPositions(walletAddress).catch(() => []);

      // Fetch and enrich positions with price/range data
      const positionsWithPriceData = await Promise.all(
        positions.map(async (pos) => {
          try {
            const poolInfo = await positionProvider.getPoolInfo(pos.poolAddress);
            const market = await positionProvider.getMarketSnapshot(pos.poolAddress);

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
            const rangePercent = ((upperBoundPrice - lowerBoundPrice) / lowerBoundPrice) * 100;

            const livePnl = livePositions.find((lp) => lp.id === pos.id)?.pnlData || pos.pnlData;

            return {
              ...pos,
              lowerBoundPrice,
              upperBoundPrice,
              activeBin: market.activeBound,
              binCount,
              rangePercent,
              pnlData: livePnl,
            };
          } catch (e) {
            logger.warn(`Failed to enrich position ${pos.id} with price data: ${e}`);
            return pos;
          }
        })
      );

      res.json({
        wallet: walletAddress,
        count: positionsWithPriceData.length,
        positions: positionsWithPriceData,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.get('/positions/history', async (_req, res) => {
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
