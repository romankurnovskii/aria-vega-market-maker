import { Router } from 'express';
import { IPositionProvider, IExecutor, IOrchestratorRegistry, IPositionStore, Position } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { getPriceFromBinId } from '@lp-system/providers';

const logger = getLogger('server');

/**
 * Creates the positions router handling position listings and actions.
 */
export function createPositionsRouter(
  positionProvider: IPositionProvider,
  executor: IExecutor,
  registry: IOrchestratorRegistry,
  walletAddress: string,
  positionStore?: IPositionStore
): Router {
  const router = Router();

  /**
   * GET /positions
   * List all active positions with enriched price and range data.
   */
  router.get('/', async (_req, res) => {
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

  /**
   * GET /positions/history
   * List archived/closed positions.
   */
  router.get('/history', async (_req, res) => {
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

  /**
   * POST /positions/:id/actions
   * Perform a unified action on a position (evaluate, removeLiquidity, etc).
   */
  router.post('/:id/actions', async (req, res) => {
    const { id } = req.params;
    const { action, strategyId } = req.body;

    if (!action) {
      res.status(400).json({ error: 'Missing action in request body' });
      return;
    }

    try {
      // 1. Fetch current on-chain state to ensure we have poolAddress and latest bounds
      const position = await positionProvider.getPosition(id);
      const market = await positionProvider.getMarketSnapshot(position.poolAddress);

      if (action === 'evaluate') {
        const orchestrators = registry.getForPosition(id);
        const targetOrch = strategyId ? orchestrators.find((o) => o.strategyId === strategyId) : orchestrators[0];

        if (!targetOrch) {
          res.status(404).json({
            error: `No active orchestrator for position ${id} ${strategyId ? `with strategy ${strategyId}` : ''} found in registry`,
          });
          return;
        }

        const result = await targetOrch.tick(position, market);
        res.json({ status: 'success', action: 'evaluate', result });
      } else if (action === 'removeLiquidity') {
        // Snapshot fees before removal
        const meta = position.metadata as Record<string, string | undefined> | undefined;
        const claimedFees = {
          tokenX: meta?.feeX || '0',
          tokenY: meta?.feeY || '0',
        };

        logger.info(`[HTTP Server] Triggering manual liquidity removal for position ${id}`);

        const executionRecord = await executor.apply(
          {
            positionId: id,
            action: 'close',
            evaluatedAt: Date.now(),
            sourceAssignmentId: 'api-manual',
          },
          market,
          async () => ({ action: 'skip' })
        );

        if (executionRecord.status === 'failed') {
          res.status(500).json({ status: 'failed', error: executionRecord.error });
          return;
        }

        res.json({
          status: 'success',
          action: 'removeLiquidity',
          transactionSignatures: executionRecord.txSignatures,
          claimedFees,
          positionClosed: true,
        });
      } else if (action === 'addLiquidity') {
        res.status(501).json({ error: 'addLiquidity action is not implemented yet' });
      } else {
        res.status(400).json({ error: `Unsupported action: ${action}` });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
