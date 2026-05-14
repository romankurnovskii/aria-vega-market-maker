import { Router } from 'express';
import { IOrchestratorRegistry, IPositionProvider } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('server');

import { OrchestratorFactory } from '@lp-system/orchestration';

export function createStrategiesRouter(
  registry: IOrchestratorRegistry,
  factory: OrchestratorFactory,
  positionProvider: IPositionProvider
): Router {
  const router = Router();

  router.post('/:id/evaluate', async (req, res) => {
    try {
      const { id: strategyId } = req.params;
      const { positionId, poolAddress } = req.body;

      if (!positionId) {
        res.status(400).json({ error: 'Missing positionId in request body' });
        return;
      }

      logger.info(`[HTTP Server] Triggering manual ad-hoc strategy evaluation for ${strategyId} on position ${positionId}`);

      const position = await positionProvider.getPosition(positionId, poolAddress);
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
      res.json({ status: 'success', result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
