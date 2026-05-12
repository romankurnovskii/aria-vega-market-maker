import { Router } from 'express';
import { IOrchestratorRegistry, IPositionProvider } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('server');

export function createStrategiesRouter(registry: IOrchestratorRegistry, positionProvider: IPositionProvider): Router {
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
      const targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

      if (!targetOrch) {
        res.status(404).json({
          error: `No active orchestrator for strategy ${strategyId} and position ${positionId} exists in registry`,
        });
        return;
      }

      const result = await targetOrch.tick(position, market);
      res.json({ status: 'success', result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  return router;
}
