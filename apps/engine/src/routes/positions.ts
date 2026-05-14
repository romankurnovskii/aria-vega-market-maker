import { Router } from 'express';
import { IOrchestratorRegistry, IPositionProvider, IExecutor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('router-positions');

export function createPositionsRouter(
  registry: IOrchestratorRegistry,
  positionProvider: IPositionProvider,
  executor: IExecutor
): Router {
  const router = Router();

  router.post('/:positionId/actions', async (req, res) => {
    try {
      const { positionId } = req.params;
      const { action, strategyId } = req.body;

      if (!action) {
        res.status(400).json({ error: 'Missing action parameter in request body' });
        return;
      }

      logger.info(`[HTTP Server] Received position action '${action}' for position ${positionId}`);

      if (action === 'evaluate') {
        if (!strategyId) {
          res.status(400).json({ error: 'Missing strategyId in request body for evaluate action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);
        const market = await positionProvider.getMarketSnapshot(position.poolAddress);

        const orchestrators = registry.getForPosition(positionId);
        const targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

        if (!targetOrch) {
          res.status(404).json({
            error: `No active orchestrator for strategy ${strategyId} and position ${positionId} exists in registry`,
          });
          return;
        }

        const result = await targetOrch.tick(position, market);
        res.json({ status: 'success', action: 'evaluate', result });
        return;
      }

      if (action === 'removeLiquidity') {
        const position = await positionProvider.getPosition(positionId);

        const execRecord = await executor.apply(
          {
            positionId,
            action: 'close',
            sourceAssignmentId: 'manual',
            evaluatedAt: Date.now(),
          },
          await positionProvider.getMarketSnapshot(position.poolAddress),
          async () => ({
            action: 'close',
          })
        );

        if (execRecord.status === 'failed') {
          res.status(500).json({ error: execRecord.error || 'Execution failed' });
          return;
        }

        res.json({
          status: 'success',
          action: 'removeLiquidity',
          transactionSignatures: execRecord.txSignatures || [],
          positionClosed: true,
        });
        return;
      }

      if (action === 'addLiquidity') {
        const { tokenXAmount, tokenYAmount, slippageTolerance } = req.body;

        if (!tokenXAmount || !tokenYAmount) {
          res.status(400).json({ error: 'Missing tokenXAmount or tokenYAmount for addLiquidity action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);

        const execRecord = await executor.apply(
          {
            positionId,
            action: 'open',
            sourceAssignmentId: 'manual',
            evaluatedAt: Date.now(),
            openParams: {
              poolAddress: position.poolAddress,
              tokenXAmount,
              tokenYAmount,
              lowerBinId: position.lowerBound,
              upperBinId: position.upperBound,
              metadata: {
                slippageTolerance: slippageTolerance ?? 100, // Default 1% (100 bps)
              },
            },
          },
          await positionProvider.getMarketSnapshot(position.poolAddress)
        );

        if (execRecord.status === 'failed') {
          res.status(500).json({ error: execRecord.error || 'Execution failed' });
          return;
        }

        res.json({
          status: 'success',
          action: 'addLiquidity',
          transactionSignatures: execRecord.txSignatures || [],
          newPositionId: execRecord.newPositionId,
        });
        return;
      }

      res.status(400).json({ error: `Invalid action type: ${action}` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
