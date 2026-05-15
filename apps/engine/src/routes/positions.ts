import { Router } from 'express';
import {
  IPositionProvider,
  IExecutor,
  IOrchestratorRegistry,
  IPositionStore,
  OpenParams,
  IStore,
  RebalanceTask,
  IRpcProvider,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('router-positions');

import { OrchestratorFactory } from '@lp-system/orchestration';
import { getPriceFromBinId } from '@lp-system/providers';
import { processTasks } from '../lifecycle.js';

/**
 * Creates the positions router handling unified position actions.
 */
export function handlePositionsRouter(
  positionProvider: IPositionProvider,
  executor: IExecutor,
  registry: IOrchestratorRegistry,
  factory: OrchestratorFactory,
  walletAddress: string,
  positionStore?: IPositionStore,
  store?: IStore,
  rpcPool?: IRpcProvider
): Router {
  void walletAddress;
  void positionStore;
  void rpcPool;
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

        const openParams = (result &&
          ('openParams' in result ? result.openParams : 'params' in result ? result.params : undefined)) as
          | OpenParams
          | undefined;
        if (openParams) {
          try {
            const poolInfo = await positionProvider.getPoolInfo(position.poolAddress);
            const lower = openParams.lowerBinId ?? openParams.lowerBound;
            const upper = openParams.upperBinId ?? openParams.upperBound;
            if (lower !== undefined && upper !== undefined) {
              const lowerBoundPrice = getPriceFromBinId(
                lower,
                poolInfo.binStep,
                position.tokenX.decimals,
                position.tokenY.decimals
              );
              const upperBoundPrice = getPriceFromBinId(
                upper,
                poolInfo.binStep,
                position.tokenX.decimals,
                position.tokenY.decimals
              );
              openParams.lowerBoundPrice = lowerBoundPrice;
              openParams.upperBoundPrice = upperBoundPrice;
              openParams.binCount = upper - lower + 1;
              openParams.rangePercent =
                lowerBoundPrice > 0 ? ((upperBoundPrice - lowerBoundPrice) / lowerBoundPrice) * 100 : 0;
            }
          } catch (enrichErr) {
            logger.warn(`Failed to enrich evaluation result with price data: ${enrichErr}`);
          }
        }

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
          await positionProvider.getMarketSnapshot(position.poolAddress)
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
          message: 'Add liquidity action queued successfully.',
          positionOpened: true,
        });
        return;
      }

      if (action === 'applySuggestion') {
        if (!strategyId) {
          res.status(400).json({ error: 'Missing strategyId in request body for applySuggestion action' });
          return;
        }

        const { suggestion } = req.body;

        if (!suggestion || !suggestion.action) {
          res.status(400).json({ error: 'Missing suggestion data in request body for applySuggestion action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);

        // Determine the actual action to perform based on the suggestion
        const actualAction = suggestion.action === 'close+open' ? 'close+open' : suggestion.action;

        // If it's a compound action (close+open), we MUST use the stateful RebalanceTask system
        if (actualAction === 'close+open' && store) {
          logger.info(`[HTTP Server] Creating stateful RebalanceTask for manual suggestion: ${actualAction}`);
          const tasksStore = store as unknown as { saveTask: (t: RebalanceTask) => Promise<void> };
          const task: RebalanceTask = {
            id: `manual_task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            assignmentId: 'manual',
            status: 'pending_close',
            originalPositionId: positionId,
            intent: {
              positionId,
              action: 'close+open',
              openParams: suggestion.openParams,
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
            },
            evaluatedAt: Date.now(),
            events: [
              {
                stage: 'INIT',
                timestamp: Date.now(),
                message: `Manual task initialized for suggestion application: ${actualAction}`,
              },
            ],
          };

          await tasksStore.saveTask(task);

          // Trigger Execution Monitor immediately for responsiveness
          processTasks(
            store,
            executor,
            positionProvider,
            registry,
            factory
          ).catch((err) => logger.error(`[HTTP Server] Error triggering processTasks: ${err.message}`));

          res.json({
            status: 'success',
            action: 'applySuggestion',
            appliedAction: actualAction,
            message: 'Rebalance task successfully queued. The engine will now execute the close and open legs asynchronously. Monitor the Event Log for real-time progress.',
            taskId: task.id,
            suggestionApplied: false, // Changed to false to reflect it is queued, not finished
          });
          return;
        }

        const execRecord = await executor.apply(
          {
            positionId,
            action: actualAction as 'close' | 'open',
            sourceAssignmentId: 'manual',
            evaluatedAt: Date.now(),
            openParams: suggestion.openParams,
          },
          await positionProvider.getMarketSnapshot(position.poolAddress)
        );

        if (execRecord.status === 'failed') {
          res.status(500).json({ error: execRecord.error || 'Execution failed' });
          return;
        }

        res.json({
          status: 'success',
          action: 'applySuggestion',
          appliedAction: suggestion.action,
          transactionSignatures: execRecord.txSignatures || [],
          suggestionApplied: true,
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
