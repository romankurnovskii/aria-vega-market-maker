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
  ExecutionRecord,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getPriceFromBinId, enrichOpenParamsForExecution, getMarketSnapshot, meteoraProvider } from '@lp-system/providers';

const logger = getLogger('router-positions');

async function getPositionForArchival(
  positionId: string,
  poolAddress: string,
  positionProvider: IPositionProvider,
  positionStore?: IPositionStore
): Promise<Position> {
  if (positionStore) {
    try {
      const known = await positionStore.getKnown();
      const found = known.find((p) => p.id === positionId);
      if (found) return found;
    } catch (err) {
      logger.warn(`Failed to read from positionStore.getKnown() in getPositionForArchival: ${err}`);
    }
  }
  return await positionProvider.getPosition(positionId, poolAddress);
}

async function handleArchiveAndCleanup(
  positionId: string,
  poolAddress: string,
  closeRecord: ExecutionRecord,
  positionProvider: IPositionProvider,
  positionStore?: IPositionStore
): Promise<void> {
  if (!positionStore) return;
  try {
    const pos = await getPositionForArchival(positionId, poolAddress, positionProvider, positionStore);

    pos.state = 'CLOSED';
    pos.closedAt = Date.now();
    pos.metadata = {
      ...pos.metadata,
      closeTxSignature: closeRecord.txSignatures?.[0] || 'unknown',
      baseFeeCollected: closeRecord.metrics?.baseFeeCollected || '0',
      quoteFeeCollected: closeRecord.metrics?.quoteFeeCollected || '0',
    };

    // Save to archived position history
    await positionStore.archivePosition(pos);

    // Remove from active known positions
    const known = await positionStore.getKnown();
    const updatedKnown = known.filter((p) => p.id !== positionId);
    await positionStore.saveKnown(updatedKnown);

    logger.info(`[positions router] Position ${positionId} successfully archived as CLOSED with collected fees.`);
  } catch (err) {
    logger.error(`[positions router] Failed to archive closed position ${positionId}: ${err}`);
  }
}

async function handleRegisterNewPosition(
  newPositionId: string,
  poolAddress: string,
  positionProvider: IPositionProvider,
  positionStore?: IPositionStore
): Promise<Position | undefined> {
  if (!positionStore) return undefined;
  try {
    let newPos: Position | undefined;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        newPos = await positionProvider.getPosition(newPositionId, poolAddress);
        break;
      } catch (err) {
        if (attempt === 3) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (newPos) {
      newPos.state = 'OPEN';
      const known = await positionStore.getKnown();

      const exists = known.some((p) => p.id === newPositionId);
      if (!exists) {
        known.push(newPos);
        await positionStore.saveKnown(known);
        logger.info(`[positions router] Registered new position ${newPositionId} in known positions.`);
      }
      return newPos;
    }
  } catch (err) {
    logger.error(`[positions router] Failed to fetch and register new position ${newPositionId}: ${err}`);
  }
  return undefined;
}

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

          // Cleanup and archive closed position immediately
          await handleArchiveAndCleanup(positionId, position.poolAddress, closeRecord, positionProvider, positionStore);

          // 2. Re-evaluate strategy with updated market data
          logger.info(`[HTTP Server][applyStrategy] Re-evaluating strategy ${strategyId} with updated market data...`);
          const updatedMarket = await getMarketSnapshot(position.poolAddress);
          const secondEvaluation = await targetOrch.tick(position, updatedMarket);
          logger.info(`[HTTP Server][applyStrategy] Second evaluation: ${secondEvaluation.action}`);

          const finalOpenParams =
            (secondEvaluation as { openParams?: OpenParams }).openParams ||
            (firstEvaluation as { openParams?: OpenParams }).openParams;
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

          // Fetch and register new position immediately
          const newPos = openRecord.newPositionId
            ? await handleRegisterNewPosition(
                openRecord.newPositionId,
                position.poolAddress,
                positionProvider,
                positionStore
              )
            : undefined;

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'close+open',
            closeRecord,
            openRecord,
            newPosition: newPos,
            transactionSignatures: [closeRecord.txSignatures?.[0], openRecord.txSignatures?.[0]].filter(Boolean),
            result: {
              action: 'close+open',
              reason: `Rebalanced position ${positionId} to new position ${openRecord.newPositionId || 'unknown'}. Collected fees: ${closeRecord.metrics?.baseFeeCollected || '0'} Base, ${closeRecord.metrics?.quoteFeeCollected || '0'} Quote.`,
              metrics: `Fees Collected: ${closeRecord.metrics?.baseFeeCollected || '0'} / ${closeRecord.metrics?.quoteFeeCollected || '0'}`,
              openParams: finalOpenParams,
            },
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

          // Cleanup and archive closed position immediately
          await handleArchiveAndCleanup(positionId, position.poolAddress, closeRecord, positionProvider, positionStore);

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'close',
            closeRecord,
            transactionSignatures: closeRecord.txSignatures || [],
            result: {
              action: 'close',
              reason: `Closed position ${positionId}. Collected fees: ${closeRecord.metrics?.baseFeeCollected || '0'} Base, ${closeRecord.metrics?.quoteFeeCollected || '0'} Quote.`,
              metrics: `Fees Collected: ${closeRecord.metrics?.baseFeeCollected || '0'} / ${closeRecord.metrics?.quoteFeeCollected || '0'}`,
            },
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

          // Fetch and register new position immediately
          const newPos = openRecord.newPositionId
            ? await handleRegisterNewPosition(
                openRecord.newPositionId,
                position.poolAddress,
                positionProvider,
                positionStore
              )
            : undefined;

          res.json({
            status: 'success',
            action: 'applyStrategy',
            appliedAction: 'open',
            openRecord,
            newPosition: newPos,
            transactionSignatures: openRecord.txSignatures || [],
            result: {
              action: 'open',
              reason: `Opened new position ${openRecord.newPositionId || 'unknown'}.`,
              openParams: firstEvaluation.openParams,
            },
          });
          return;
        }

        // Default case: skip
        res.json({
          status: 'success',
          action: 'applyStrategy',
          appliedAction: 'skip',
          result: {
            action: 'skip',
            reason: 'Strategy suggests skip. No actions performed.',
          },
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

          // Cleanup and archive closed position immediately
          await handleArchiveAndCleanup(positionId, position.poolAddress, closeRecord, positionProvider, positionStore);

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

          // Fetch and register new position immediately
          const newPos = openRecord.newPositionId
            ? await handleRegisterNewPosition(
                openRecord.newPositionId,
                position.poolAddress,
                positionProvider,
                positionStore
              )
            : undefined;

          res.json({
            status: 'success',
            action: 'applySuggestion',
            appliedAction: 'close+open',
            closeRecord,
            openRecord,
            newPosition: newPos,
            transactionSignatures: [closeRecord.txSignatures?.[0], openRecord.txSignatures?.[0]].filter(Boolean),
            result: {
              action: 'close+open',
              reason: `Applied close+open rebalance for suggestion. Rebalanced position ${positionId} to new position ${openRecord.newPositionId || 'unknown'}. Collected fees: ${closeRecord.metrics?.baseFeeCollected || '0'} Base, ${closeRecord.metrics?.quoteFeeCollected || '0'} Quote.`,
              metrics: `Fees Collected: ${closeRecord.metrics?.baseFeeCollected || '0'} / ${closeRecord.metrics?.quoteFeeCollected || '0'}`,
              openParams: suggestion.openParams,
            },
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

        if (actualAction === 'close') {
          // Cleanup and archive closed position immediately
          await handleArchiveAndCleanup(positionId, position.poolAddress, execRecord, positionProvider, positionStore);

          res.json({
            status: 'success',
            action: 'applySuggestion',
            appliedAction: 'close',
            closeRecord: execRecord,
            transactionSignatures: execRecord.txSignatures || [],
            result: {
              action: 'close',
              reason: `Closed position ${positionId}. Collected fees: ${execRecord.metrics?.baseFeeCollected || '0'} Base, ${execRecord.metrics?.quoteFeeCollected || '0'} Quote.`,
              metrics: `Fees Collected: ${execRecord.metrics?.baseFeeCollected || '0'} / ${execRecord.metrics?.quoteFeeCollected || '0'}`,
            },
            suggestionApplied: true,
          });
          return;
        }

        if (actualAction === 'open') {
          // Fetch and register new position immediately
          const newPos = execRecord.newPositionId
            ? await handleRegisterNewPosition(
                execRecord.newPositionId,
                position.poolAddress,
                positionProvider,
                positionStore
              )
            : undefined;

          res.json({
            status: 'success',
            action: 'applySuggestion',
            appliedAction: 'open',
            openRecord: execRecord,
            newPosition: newPos,
            transactionSignatures: execRecord.txSignatures || [],
            result: {
              action: 'open',
              reason: `Opened new position ${execRecord.newPositionId || 'unknown'}.`,
              openParams: suggestion.openParams,
            },
            suggestionApplied: true,
          });
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
