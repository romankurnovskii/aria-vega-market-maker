import { Router } from 'express';
import {
  IPositionProvider,
  IExecutor,
  IOrchestratorRegistry,
  OpenParams,
  IPositionStore,
  Position,
  PoolInfo,
  MarketSnapshot,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getPriceFromBinId, enrichOpenParamsForExecution, getMarketSnapshot, meteoraProvider } from '@lp-system/providers';

const logger = getLogger('router-positions');

/**
 * Creates the positions router handling unified position actions.
 */
export function handlePositionsRouter(
  positionProvider: IPositionProvider,
  executor: IExecutor,
  registry: IOrchestratorRegistry,
  factory: OrchestratorFactory,
  positionStore?: IPositionStore,
  walletAddress: string = ''
): Router {
  const router = Router();

  /**
   * POST /positions/:positionId/actions
   * Perform a position action (removeLiquidity, applySuggestion, evaluateStrategy).
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

      if (action === 'evaluateStrategy') {
        if (!strategyId) {
          res.status(400).json({ error: 'Missing strategyId in request body for evaluateStrategy action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);
        const market = await getMarketSnapshot(position.poolAddress);

        const orchestrators = registry.getForPosition(positionId);
        let targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

        if (!targetOrch) {
          logger.info(
            `[HTTP Server] No active orchestrator for strategy ${strategyId} on position ${positionId}, creating ad-hoc.`
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
            res.status(404).json({ error: `Strategy ${strategyId} is not registered: ${msg}` });
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
            const poolInfo = await meteoraProvider.getPoolInfo(position.poolAddress);
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

        res.json({ status: 'success', action: 'evaluateStrategy', result });
        return;
      }

      if (action === 'applyStrategy') {
        if (!strategyId) {
          res.status(400).json({ error: 'Missing strategyId in request body for applyStrategy action' });
          return;
        }

        const position = await positionProvider.getPosition(positionId);
        const market = await getMarketSnapshot(position.poolAddress);

        const orchestrators = registry.getForPosition(positionId);
        let targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

        if (!targetOrch) {
          logger.info(
            `[HTTP Server] No active orchestrator for strategy ${strategyId} on position ${positionId}, creating ad-hoc.`
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
            res.status(404).json({ error: `Strategy ${strategyId} is not registered: ${msg}` });
            return;
          }
        }

        const firstEvaluation = await targetOrch.tick(position, market);
        logger.info(`[HTTP Server] First evaluation for applyStrategy: ${firstEvaluation.action}`);

        if (firstEvaluation.action === 'close+open') {
          // 1. Close
          logger.info(`[HTTP Server][applyStrategy] Closing position ${positionId}...`);
          const closeRecord = await executor.apply(
            {
              positionId,
              action: 'close',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
            },
            market
          );

          logger.info(
            `[HTTP Server][applyStrategy] Close Result: ${closeRecord.status}. Tx: ${closeRecord.txSignatures?.join(', ')}`
          );

          if (closeRecord.status === 'failed') {
            res.status(500).json({
              error: `Close failed: ${closeRecord.error}`,
              step: 'close',
              closeRecord,
            });
            return;
          }

          // 2. Re-evaluate strategy with updated market data
          logger.info(`[HTTP Server][applyStrategy] Re-evaluating strategy ${strategyId} with updated market data...`);
          const updatedMarket = await getMarketSnapshot(position.poolAddress);
          const secondEvaluation = await targetOrch.tick(position, updatedMarket);
          logger.info(`[HTTP Server][applyStrategy] Second evaluation: ${secondEvaluation.action}`);

          const finalOpenParams = secondEvaluation.openParams || firstEvaluation.openParams;
          if (!finalOpenParams) {
            res.status(500).json({
              error: 'Missing openParams in strategy evaluation for opening new position',
              step: 're-evaluate',
              closeRecord,
              secondEvaluation,
            });
            return;
          }

          // 3. Open new position
          const poolInfo = await meteoraProvider.getPoolInfo(position.poolAddress);
          const enrichedOpenParams = enrichOpenParamsForExecution(
            finalOpenParams,
            { tokenXDecimals: position.tokenX.decimals, tokenYDecimals: position.tokenY.decimals },
            poolInfo
          );

          logger.info(`[HTTP Server][applyStrategy] Opening new position in pool ${position.poolAddress}...`);
          const openRecord = await executor.apply(
            {
              positionId,
              action: 'open',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
              openParams: enrichedOpenParams,
            },
            updatedMarket
          );

          logger.info(
            `[HTTP Server][applyStrategy] Open Result: ${openRecord.status}. Tx: ${openRecord.txSignatures?.join(', ')}`
          );

          if (openRecord.status === 'failed') {
            res.status(500).json({
              error: `Close succeeded but Open failed: ${openRecord.error}`,
              step: 'open',
              closeRecord,
              openRecord,
            });
            return;
          }

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'close+open',
            closeRecord,
            openRecord,
            message: 'Direct close+open rebalance from strategy completed successfully.',
          });
          return;
        }

        if (firstEvaluation.action === 'close') {
          logger.info(`[HTTP Server][applyStrategy] Closing position ${positionId}...`);
          const closeRecord = await executor.apply(
            {
              positionId,
              action: 'close',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
            },
            market
          );

          if (closeRecord.status === 'failed') {
            res.status(500).json({ error: `Close failed: ${closeRecord.error}`, closeRecord });
            return;
          }

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'close',
            closeRecord,
          });
          return;
        }

        if (firstEvaluation.action === 'open') {
          if (!firstEvaluation.openParams) {
            res.status(400).json({ error: 'Missing openParams in strategy open recommendation' });
            return;
          }

          const poolInfo = await meteoraProvider.getPoolInfo(position.poolAddress);
          const enrichedOpenParams = enrichOpenParamsForExecution(
            firstEvaluation.openParams,
            { tokenXDecimals: position.tokenX.decimals, tokenYDecimals: position.tokenY.decimals },
            poolInfo
          );

          logger.info(`[HTTP Server][applyStrategy] Opening position...`);
          const openRecord = await executor.apply(
            {
              positionId,
              action: 'open',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
              openParams: enrichedOpenParams,
            },
            market
          );

          if (openRecord.status === 'failed') {
            res.status(500).json({ error: `Open failed: ${openRecord.error}`, openRecord });
            return;
          }

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'open',
            openRecord,
          });
          return;
        }

        // Default case: skip
        res.json({
          status: 'success',
          action: 'applyStrategy',
          appliedAction: 'skip',
          result: firstEvaluation,
          message: 'Strategy suggests skip. No actions performed.',
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

        // Enrich openParams with decimal amounts and prices before execution
        let enrichedOpenParams: OpenParams | undefined;
        if (suggestion.openParams) {
          const poolInfo = await meteoraProvider.getPoolInfo(position.poolAddress);
          enrichedOpenParams = enrichOpenParamsForExecution(
            suggestion.openParams,
            { tokenXDecimals: position.tokenX.decimals, tokenYDecimals: position.tokenY.decimals },
            poolInfo
          );
        }

        // Determine the actual action to perform based on the suggestion
        const actualAction = suggestion.action === 'close+open' ? 'close+open' : suggestion.action;

        if (actualAction === 'close+open') {
          if (!enrichedOpenParams) {
            res.status(400).json({ error: 'Missing or invalid openParams in suggestion for close+open action' });
            return;
          }

          logger.info(`[HTTP Server] Executing direct close+open for position ${positionId}`);

          // 1. Close
          logger.info(`[HTTP Server][Close] Closing position ${positionId}...`);
          const closeRecord = await executor.apply(
            {
              positionId,
              action: 'close',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
            },
            await getMarketSnapshot(position.poolAddress)
          );

          logger.info(`[HTTP Server][Close] Result: ${closeRecord.status}. Tx: ${closeRecord.txSignatures?.join(', ')}`);

          if (closeRecord.status === 'failed') {
            res.status(500).json({
              error: `Close failed: ${closeRecord.error}`,
              step: 'close',
              closeRecord,
            });
            return;
          }

          // 2. Open
          logger.info(`[HTTP Server][Open] Opening new position in pool ${position.poolAddress}...`);
          const openRecord = await executor.apply(
            {
              positionId,
              action: 'open',
              sourceAssignmentId: 'manual',
              evaluatedAt: Date.now(),
              openParams: enrichedOpenParams,
            },
            await getMarketSnapshot(position.poolAddress)
          );

          logger.info(`[HTTP Server][Open] Result: ${openRecord.status}. Tx: ${openRecord.txSignatures?.join(', ')}`);

          if (openRecord.status === 'failed') {
            res.status(500).json({
              error: `Close succeeded but Open failed: ${openRecord.error}`,
              step: 'open',
              closeRecord,
              openRecord,
            });
            return;
          }

          res.json({
            status: 'success',
            action: 'applySuggestion',
            appliedAction: 'close+open',
            closeRecord,
            openRecord,
            message: 'Direct close+open rebalance completed successfully.',
          });
          return;
        }

        const execRecord = await executor.apply(
          {
            positionId,
            action: actualAction as 'close' | 'open',
            sourceAssignmentId: 'manual',
            evaluatedAt: Date.now(),
            openParams: enrichedOpenParams,
          },
          await getMarketSnapshot(position.poolAddress)
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

  router.get('/', async (req, res) => {
    try {
      const targetWallet = (req.query.wallet as string) || walletAddress;

      let positions: Position[];

      if (positionStore) {
        positions = await positionStore.getKnown();
      } else {
        positions = await positionProvider.getPositions(targetWallet);
      }

      const uniquePools = [...new Set(positions.map((p) => p.poolAddress))];
      const poolDataMap = new Map<string, { poolInfo: PoolInfo; market: MarketSnapshot }>();

      await Promise.all(
        uniquePools.map(async (poolAddress) => {
          try {
            const [poolInfo, market] = await Promise.all([
              meteoraProvider.getPoolInfo(poolAddress),
              getMarketSnapshot(poolAddress),
            ]);
            poolDataMap.set(poolAddress, { poolInfo, market });
          } catch (e) {
            logger.warn(`Failed to fetch metadata for pool ${poolAddress}: ${e}`);
          }
        })
      );

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

  router.get(['/history', '/closed'], async (_req, res) => {
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

  return router;
}
