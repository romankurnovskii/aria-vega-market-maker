import { Router } from 'express';
import { IOrchestratorRegistry, IPositionProvider, OpenParams } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('server');

import { OrchestratorFactory } from '@lp-system/orchestration';
import { getPriceFromBinId } from '@lp-system/providers';

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

      res.json({ status: 'success', result });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
