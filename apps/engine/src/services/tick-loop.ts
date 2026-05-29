/**
 * @file tick-loop.ts
 * @description Background execution daemon that periodically evaluates active strategy assignments and automates rebalances.
 *
 * @features
 * - Sequential execution: Evaluates active positions one by one to avoid transaction races
 * - Local cache synchronization: Reads current positions from JsonPositionStore cache for fast operations
 * - Automatically executes close+open (rebalance) and close standalone recommendations on-chain
 * - Registers new positions, archives closed positions, transfers strategy assignments, and logs lineage
 * - Writes detailed ExecutionRecord logs for full auditability
 * - Employs a concurrency guard to prevent tick cycles from overlapping
 *
 * @dependencies @lp-system/core, @lp-system/orchestration, @lp-system/providers, @lp-system/logger, strategy-reassignment.js
 * @sideEffects Spawns setInterval timers, executes Solana transactions via IExecutor, reads/writes JSON storage
 */

import {
  IOrchestratorRegistry,
  IPositionProvider,
  IExecutor,
  IStore,
  IPositionStore,
  ILineageStore,
  Position,
  ExecutionRecord,
  OpenParams,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';
import { getMarketSnapshot, enrichOpenParamsForExecution, meteoraProvider } from '@lp-system/providers';
import { handleReassignStrategy } from './strategy-reassignment.js';
import { positionGuard } from './position-guard.js';

const logger = getLogger('tick-loop');

/**
 * Background loop service to automate strategy ticks and executing on-chain rebalances.
 */
export class TickLoopService {
  private intervalId: NodeJS.Timeout | null = null;
  private tickInProgress = false;

  /**
   * Constructs the TickLoopService with all required system dependencies.
   *
   * @param {IOrchestratorRegistry} registry - In-memory orchestrator registry.
   * @param {IPositionProvider} positionProvider - External blockchain position provider.
   * @param {IExecutor} executor - On-chain transaction execution dispatcher.
   * @param {IStore} store - Persistent configuration and audit log store.
   * @param {IPositionStore} positionStore - Local position state cache.
   * @param {ILineageStore} lineageStore - Position succession lineage tracking store.
   * @param {OrchestratorFactory} factory - Factory for instantiating new strategy orchestrators.
   * @param {string} walletAddress - Active system Solana wallet address.
   * @param {number} tickIntervalMs - Cycle frequency in milliseconds.
   */
  constructor(
    private registry: IOrchestratorRegistry,
    private positionProvider: IPositionProvider,
    private executor: IExecutor,
    private store: IStore,
    private positionStore: IPositionStore,
    private lineageStore: ILineageStore,
    private factory: OrchestratorFactory,
    _walletAddress: string,
    private tickIntervalMs: number
  ) {}

  /**
   * Starts the background execution loop.
   */
  public start(): void {
    if (this.intervalId) {
      logger.warn('[TickLoopService] Tick loop is already running.');
      return;
    }
    logger.info(`[TickLoopService] Starting background tick loop on interval of ${this.tickIntervalMs / 1000}s`);

    // Run first tick after 5 seconds to let engine boot complete, then every tickIntervalMs
    setTimeout(() => {
      this.tickAll().catch((err) => logger.error('[TickLoopService] Error in startup tickAll execution:', err));
    }, 5000);

    this.intervalId = setInterval(() => {
      this.tickAll().catch((err) => logger.error('[TickLoopService] Error in tickAll execution:', err));
    }, this.tickIntervalMs);
  }

  /**
   * Stops the background execution loop.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('[TickLoopService] Background tick loop stopped.');
    }
  }

  /**
   * Iterates through all registered active orchestrators and ticks them sequentially.
   *
   * @private
   * @returns {Promise<void>} Resolves when all orchestrators have been processed.
   */
  private async tickAll(): Promise<void> {
    if (this.tickInProgress) {
      logger.warn('[TickLoopService] Tick execution cycle in progress. Overlapping cycle skipped.');
      return;
    }

    try {
      this.tickInProgress = true;
      const orchestrators = this.registry.getAll();

      if (orchestrators.length === 0) {
        logger.info('[TickLoopService] No orchestrators registered. Skipping cycle.');
        return;
      }

      logger.info(`[TickLoopService] Running tick cycle for ${orchestrators.length} registered orchestrator(s)...`);

      // Read current active positions from local cache store to prevent redundant RPC lookups
      const knownPositions = await this.positionStore.getKnown();

      for (const orchestrator of orchestrators) {
        if (!positionGuard.tryAcquire(orchestrator.positionId)) {
          logger.info(`[TickLoopService] Position ${orchestrator.positionId} is locked by another operation. Skipping.`);
          continue;
        }

        try {
          if (orchestrator.mode === 'pending_open') {
            logger.info(
              `[TickLoopService] Orchestrator ${orchestrator.id} is in pending_open mode. Retrying open execution...`
            );
            const assignments = await this.store.getAssignments();
            const assignment = assignments.find((a) => a.id === orchestrator.assignmentId);

            if (!assignment || !assignment.recoveryData) {
              logger.error(
                `[TickLoopService] Recovery data missing for pending_open assignment ${orchestrator.assignmentId}. Deregistering.`
              );
              this.registry.deregister(orchestrator.id);
              continue;
            }

            const { poolAddress, oldPosition, openParams: legacyOpenParams, closeTxSignature } = assignment.recoveryData!;
            const market = await getMarketSnapshot(poolAddress);

            let enrichedOpenParams: OpenParams | undefined;
            if (oldPosition) {
              logger.info(`[TickLoopService] Retrying OPEN for pool ${poolAddress}... Re-evaluating strategy...`);
              const retryEval = await orchestrator.tick(oldPosition, market);
              const openParams = 'openParams' in retryEval ? retryEval.openParams : undefined;
              if (!openParams) {
                logger.error(`[TickLoopService] Re-evaluation returned no openParams. Aborting retry.`);
                continue;
              }

              const poolInfo = await meteoraProvider.getPoolInfo(poolAddress);
              enrichedOpenParams = enrichOpenParamsForExecution(
                openParams,
                { tokenXDecimals: oldPosition.tokenX.decimals, tokenYDecimals: oldPosition.tokenY.decimals },
                poolInfo
              );
            } else if (legacyOpenParams) {
              logger.info(`[TickLoopService] Retrying OPEN for pool ${poolAddress}... using legacy cached openParams...`);
              enrichedOpenParams = legacyOpenParams;
            } else {
              logger.error(`[TickLoopService] Missing both oldPosition and openParams in recoveryData. Cannot retry.`);
              continue;
            }

            const retryOpenRecord = await this.executor.apply(
              {
                positionId: 'new',
                action: 'open',
                sourceAssignmentId: orchestrator.assignmentId,
                evaluatedAt: Date.now(),
                openParams: enrichedOpenParams,
              },
              market
            );

            if (retryOpenRecord.status === 'failed') {
              logger.error(`[TickLoopService] Retry Open failed: ${retryOpenRecord.error}`);
              await this.store.saveExecutionRecord(retryOpenRecord);
              continue;
            }

            if (retryOpenRecord.newPositionId) {
              // Eagerly register, but don't block reassignment if Datapi is slow
              await this.registerNewPosition(retryOpenRecord.newPositionId, poolAddress);

              await handleReassignStrategy({
                oldPositionId: assignment.positionId,
                newPositionId: retryOpenRecord.newPositionId,
                poolAddress,
                strategyId: orchestrator.strategyId,
                oldAssignmentId: orchestrator.assignmentId,
                closeTxSignature,
                openTxSignature: retryOpenRecord.txSignatures?.[0] || 'unknown',
                store: this.store,
                registry: this.registry,
                factory: this.factory,
                lineageStore: this.lineageStore,
              });
            }
            await this.store.saveExecutionRecord(retryOpenRecord);
            continue;
          }

          const position = knownPositions.find((p) => p.id === orchestrator.positionId);

          if (!position) {
            logger.warn(
              `[TickLoopService] Monitored assignment ${orchestrator.assignmentId} targets position ${orchestrator.positionId} which is not found in local known positions cache. Skipping.`
            );
            continue;
          }

          if (position.state === 'CLOSED') {
            logger.info(`[TickLoopService] Position ${position.id} is closed in local cache. Skipping evaluation.`);
            continue;
          }

          logger.info(`[TickLoopService] Evaluating position ${position.id} with strategy ${orchestrator.strategyId}...`);

          // Fetch fresh market snapshot for the pool (immutable address)
          const market = await getMarketSnapshot(position.poolAddress);

          // Evaluate the strategy
          const result = await orchestrator.tick(position, market);

          if (result.action === 'skip') {
            continue;
          }

          // Case A: Strategy recommends Close + Open (Rebalance)
          if (result.action === 'close+open') {
            logger.info(
              `[TickLoopService] Strategy ${orchestrator.strategyId} recommends CLOSE+OPEN rebalance on position ${position.id}`
            );

            // 1. Close execution
            logger.info(`[TickLoopService] Closing position ${position.id}...`);
            const closeRecord = await this.executor.apply(
              {
                positionId: position.id,
                action: 'close',
                sourceAssignmentId: orchestrator.assignmentId,
                evaluatedAt: Date.now(),
              },
              market
            );

            if (closeRecord.status === 'failed') {
              logger.error(`[TickLoopService] Close failed for ${position.id}: ${closeRecord.error}`);
              await this.store.saveExecutionRecord(closeRecord);
              continue;
            }

            // Cleanup local store for old position immediately
            await this.archiveAndCleanup(position, closeRecord);

            // 2. Fetch updated market snapshot and re-evaluate strategy parameters
            logger.info(`[TickLoopService] Re-evaluating strategy with updated market snapshot...`);
            const updatedMarket = await getMarketSnapshot(position.poolAddress);
            const secondEval = await orchestrator.tick(position, updatedMarket);

            const finalOpenParams =
              ('openParams' in secondEval ? secondEval.openParams : undefined) ||
              ('openParams' in result ? result.openParams : undefined);
            if (!finalOpenParams) {
              logger.error(
                `[TickLoopService] Rebalance close succeeded but second evaluation returned no open parameters. Aborting re-open.`
              );
              await this.store.saveExecutionRecord(closeRecord);
              continue;
            }

            // 3. Open execution
            const poolInfo = await meteoraProvider.getPoolInfo(position.poolAddress);
            const enrichedOpenParams = enrichOpenParamsForExecution(
              finalOpenParams,
              { tokenXDecimals: position.tokenX.decimals, tokenYDecimals: position.tokenY.decimals },
              poolInfo
            );

            logger.info(`[TickLoopService] Opening new position in pool ${position.poolAddress}...`);
            const openRecord = await this.executor.apply(
              {
                positionId: 'new',
                action: 'open',
                sourceAssignmentId: orchestrator.assignmentId,
                evaluatedAt: Date.now(),
                openParams: enrichedOpenParams,
              },
              updatedMarket
            );

            if (openRecord.status === 'failed') {
              logger.error(`[TickLoopService] Close succeeded but Open failed for ${position.id}: ${openRecord.error}`);
              await this.store.saveExecutionRecord(openRecord);

              // Handle pending open state
              const assignments = await this.store.getAssignments();
              const oldAssignment = assignments.find((a) => a.id === orchestrator.assignmentId);
              if (oldAssignment) {
                oldAssignment.mode = 'pending_open';
                oldAssignment.recoveryData = {
                  poolAddress: position.poolAddress,
                  oldPosition: position,
                  closeTxSignature: closeRecord.txSignatures?.[0] || 'unknown',
                };
                await this.store.saveAssignment(oldAssignment);
                orchestrator.mode = 'pending_open';
                logger.info(
                  `[TickLoopService] Assignment ${oldAssignment.id} set to pending_open. Will retry on next tick.`
                );
              }
              continue;
            }

            // Fetch and register new position immediately
            if (openRecord.newPositionId) {
              // We attempt to eagerly register the new position, but we don't block reassignment if it fails
              // because Meteora Datapi often takes 10-30s to index new positions.
              await this.registerNewPosition(openRecord.newPositionId, position.poolAddress);

              // Reassign the strategy to the new position, records lineage, cleans up old assignment
              await handleReassignStrategy({
                oldPositionId: position.id,
                newPositionId: openRecord.newPositionId,
                poolAddress: position.poolAddress,
                strategyId: orchestrator.strategyId,
                oldAssignmentId: orchestrator.assignmentId,
                closeTxSignature: closeRecord.txSignatures?.[0] || 'unknown',
                openTxSignature: openRecord.txSignatures?.[0] || 'unknown',
                store: this.store,
                registry: this.registry,
                factory: this.factory,
                lineageStore: this.lineageStore,
              });
            }

            // Save both execution logs
            await this.store.saveExecutionRecord(closeRecord);
            await this.store.saveExecutionRecord(openRecord);
            logger.info(`[TickLoopService] CLOSE+OPEN automated rebalance completed successfully for ${position.id}`);
            continue;
          }

          // Case B: Strategy recommends Close Standalone
          if (result.action === 'close') {
            logger.info(`[TickLoopService] Strategy ${orchestrator.strategyId} recommends CLOSE on position ${position.id}`);

            logger.info(`[TickLoopService] Closing position ${position.id}...`);
            const closeRecord = await this.executor.apply(
              {
                positionId: position.id,
                action: 'close',
                sourceAssignmentId: orchestrator.assignmentId,
                evaluatedAt: Date.now(),
              },
              market
            );

            await this.store.saveExecutionRecord(closeRecord);

            if (closeRecord.status === 'success') {
              await this.archiveAndCleanup(position, closeRecord);
              logger.info(`[TickLoopService] CLOSE automated execution completed successfully for ${position.id}`);
            } else {
              logger.error(`[TickLoopService] Automated close execution failed for ${position.id}: ${closeRecord.error}`);
            }
          }
        } catch (orchErr) {
          logger.error(
            `[TickLoopService] Failed to process orchestrator ${orchestrator.id} for position ${orchestrator.positionId}:`,
            orchErr
          );
        } finally {
          positionGuard.release(orchestrator.positionId);
        }
      }
    } finally {
      this.tickInProgress = false;
    }
  }

  /**
   * Move old closed position from active known list to archives.
   *
   * @private
   * @param {Position} position - Closed position.
   * @param {ExecutionRecord} closeRecord - Execution record details.
   */
  private async archiveAndCleanup(position: Position, closeRecord: ExecutionRecord): Promise<void> {
    try {
      const posToArchive = { ...position };
      posToArchive.state = 'CLOSED';
      posToArchive.closedAt = Date.now();
      posToArchive.metadata = {
        ...posToArchive.metadata,
        closeTxSignature: closeRecord.txSignatures?.[0] || 'unknown',
        baseFeeCollected: closeRecord.metrics?.baseFeeCollected || '0',
        quoteFeeCollected: closeRecord.metrics?.quoteFeeCollected || '0',
      };

      await this.positionStore.archivePosition(posToArchive);

      const known = await this.positionStore.getKnown();
      const updatedKnown = known.filter((p) => p.id !== position.id);
      await this.positionStore.saveKnown(updatedKnown);

      logger.info(`[TickLoopService] Position ${position.id} successfully archived as CLOSED.`);
    } catch (err) {
      logger.error(`[TickLoopService] Failed to archive position ${position.id}:`, err);
    }
  }

  /**
   * Fetch new position metadata and register it in local known positions cache.
   *
   * @private
   * @param {string} newPositionId - Public ID/Keypair address of the new position.
   * @param {string} poolAddress - Pool address.
   * @returns {Promise<Position | undefined>} The newly registered position, or undefined on failure.
   */
  private async registerNewPosition(newPositionId: string, poolAddress: string): Promise<Position | undefined> {
    try {
      let newPos: Position | undefined;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          newPos = await this.positionProvider.getPosition(newPositionId, poolAddress);
          break;
        } catch (err) {
          if (attempt === 3) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (newPos) {
        newPos.state = 'OPEN';
        const known = await this.positionStore.getKnown();
        const exists = known.some((p) => p.id === newPositionId);
        if (!exists) {
          known.push(newPos);
          await this.positionStore.saveKnown(known);
          logger.info(`[TickLoopService] Registered new position ${newPositionId} in known positions.`);
        }
        return newPos;
      }
    } catch (err) {
      logger.error(`[TickLoopService] Failed to fetch and register new position ${newPositionId}:`, err);
    }
    return undefined;
  }
}
