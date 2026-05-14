import { Router } from 'express';
import { IPositionProvider, IExecutor, IOrchestratorRegistry, IPositionStore } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('router-positions');

import { OrchestratorFactory } from '@lp-system/orchestration';

/**
 * Creates the positions router handling unified position actions.
 */
export function handlePositionsRouter(
  positionProvider: IPositionProvider,
  executor: IExecutor,
  registry: IOrchestratorRegistry,
  factory: OrchestratorFactory,
  walletAddress: string,
  positionStore?: IPositionStore
): Router {
  void walletAddress;
  void positionStore;
  const router = Router();

  /**
   * POST /positions/:positionId/actions
   * Perform a unified action on a position (evaluate, removeLiquidity, addLiquidity).
   */
  router.post('/:positionId/actions', async (req, res) => {
    const { positionId } = req.params;
    const { action, strategyId } = req.body;

    if (!action) {
      res.status(400).json({ error: 'Missing action parameter in request body' });
      return;
    }

    try {
      logger.info(`[HTTP Server] Received position action '${action}' for position ${positionId}`);

      if (action === 'evaluate') {
        if (!strategyId) {
          res.status(400).json({ error: 'Missing strategyId in request body for evaluate action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);
        const market = await positionProvider.getMarketSnapshot(position.poolAddress);

        const orchestrators = registry.getForPosition(positionId);
        let targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

        if (!targetOrch) {
          logger.info(
            `[HTTP Server] No active orchestrator found for strategy ${strategyId} on position ${positionId}, creating ad-hoc orchestrator for evaluation.`
          );
          try {
            targetOrch = factory.create({
              id: `adhoc_${Date.now()}`,
              positionId,
              strategyId,
              mode: 'monitoring',
              createdAt: Date.now(),
            });
          } catch (factoryErr: unknown) {
            const msg = factoryErr instanceof Error ? factoryErr.message : String(factoryErr);
            res.status(404).json({
              error: `Strategy ${strategyId} is not registered or cannot be instantiated: ${msg}`,
            });
            return;
          }
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
          res.status(400).json({ error: 'Missing tokenXAmount or tokenYAmount in request body for addLiquidity action' });
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
              lowerBound: position.lowerBound,
              upperBound: position.upperBound,
              lowerBinId: position.lowerBound,
              upperBinId: position.upperBound,
              metadata: {
                slippageTolerance: slippageTolerance ?? 50, // Default 0.5% (50 bps)
              },
            },
          },
          await positionProvider.getMarketSnapshot(position.poolAddress),
          async () => ({ action: 'skip' })
        );

        if (execRecord.status === 'failed') {
          res.status(500).json({ error: execRecord.error || 'Execution failed' });
          return;
        }

        res.json({
          status: 'success',
          action: 'addLiquidity',
          transactionSignatures: execRecord.txSignatures || [],
          positionOpened: true,
        });
        return;
      }

      res.status(400).json({ error: `Unsupported action: ${action}` });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
