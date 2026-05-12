/**
 * @file lifecycle.ts
 * @description Engine lifecycle management: discovery and tick loop orchestration.
 *
 * @features
 * - startDiscovery(): Initial position discovery — detects new/closed positions, syncs local store, registers orchestrators
 * - startTickLoop(): Continuous evaluation loop — ticks all orchestrators, gates decisions, executes via executor, persists records
 *
 * @dependencies All I* interfaces from @lp-system/core, OrchestratorFactory
 * @sideEffects startDiscovery modifies JsonPositionStore; startTickLoop spawns interval that mutates persistent store and calls executor
 */

import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

import {
  IPositionProvider,
  IPositionStore,
  IStore,
  IOrchestratorRegistry,
  IExecutionGate,
  IExecutor,
  IRpcProvider,
  Recommendation,
  Decision,
  Position,
  RebalanceTask,
  StrategyResult,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';

import { isDeepStrictEqual } from 'node:util';

const logger = getLogger('lifecycle');

import { PublicKey, Connection } from '@solana/web3.js';

/**
 * Robust helper to fetch raw SPL token account balances for token X and token Y of a pool.
 */
async function getWalletBalances(
  connection: Connection,
  walletAddress: string,
  mintX: string,
  mintY: string
): Promise<{ amountX: string; amountY: string }> {
  let amountX = '0';
  let amountY = '0';

  const tokenProgramId = TOKEN_PROGRAM_ID;
  const token2022ProgramId = TOKEN_2022_PROGRAM_ID;

  const fetchForProgram = async (programId: PublicKey) => {
    const response = await connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), { programId });

    for (const account of response.value) {
      const info = account.account.data.parsed.info;
      const mint = info.mint;
      const amount = info.tokenAmount.amount;

      if (mint === mintX) {
        amountX = amount;
      } else if (mint === mintY) {
        amountY = amount;
      }
    }
  };

  await fetchForProgram(tokenProgramId);
  await fetchForProgram(token2022ProgramId);

  return { amountX, amountY };
}
/**
 * Starts the one-time position discovery cycle.
 * Fetches live on-chain positions, identifies new vs closed, and registers new orchestrators.
 *
 * @param {string} walletAddress - Wallet to fetch positions for.
 * @param {IPositionProvider} positionProvider - Data source for on-chain positions and markets.
 * @param {IPositionStore} positionStore - Persistence layer for known position cache.
 * @param {OrchestratorFactory} factory - Creates orchestrators for new assignments.
 * @param {IStore} store - Assignment store (for matching assignments to new positions).
 * @param {IOrchestratorRegistry} registry - Runtime registry where new orchestrators are registered.
 */
export async function startDiscovery(
  walletAddress: string,
  positionProvider: IPositionProvider,
  positionStore: IPositionStore,
  factory: OrchestratorFactory,
  store: IStore,
  registry: IOrchestratorRegistry
): Promise<void> {
  logger.info('[Discovery] Triggering position discovery cycle...');

  // 1. Fetch live positions, known persisted positions, and active tasks
  const livePositions = await positionProvider.getPositions(walletAddress);
  const knownPositions = await positionStore.getKnown();
  const assignments = await store.getAssignments();

  const tasksStore = store as unknown as { getTasks?: () => Promise<RebalanceTask[]> };
  const tasks = tasksStore.getTasks ? await tasksStore.getTasks() : [];

  const liveIds = new Set(livePositions.map((p) => p.id));
  const knownIds = new Set(knownPositions.map((p) => p.id));
  const inFlightPositionIds = new Set<string>(
    tasks
      .filter((t: RebalanceTask) => t.status === 'awaiting_settlement' || t.status === 'pending_open')
      .map((t: RebalanceTask) => t.originalPositionId)
  );

  // 2. Identify live positions and ensure their orchestrators are registered
  for (const livePos of livePositions) {
    const isNew = !knownIds.has(livePos.id);
    if (isNew) {
      logger.info(`[Discovery] Discovered new live position: ${livePos.id}`);
    } else {
      logger.info(`[Discovery] Active known position verified on-chain: ${livePos.id}`);
    }

    // Always ensure matching assignments have a registered orchestrator in runtime registry on boot
    const matchingAssignments = assignments.filter((a) => a.positionId === livePos.id);
    const existingOrchs = registry.getForPosition(livePos.id);

    for (const assignment of matchingAssignments) {
      if (!existingOrchs.some((o) => o.id === assignment.id)) {
        logger.info(
          `[Discovery] Registering orchestrator on startup for assignment ${assignment.id} (strategy: ${assignment.strategyId}) targeting position ${livePos.id}`
        );
        const orchestrator = factory.create(assignment);
        registry.register(orchestrator);
      }
    }
  }

  // 3. Identify closed/removed positions
  for (const knownPos of knownPositions) {
    if (!liveIds.has(knownPos.id) && !inFlightPositionIds.has(knownPos.id)) {
      logger.info(`[Discovery] Known position ${knownPos.id} is no longer on-chain. Pruning.`);

      const activeOrchestrators = registry.getForPosition(knownPos.id);
      for (const orch of activeOrchestrators) {
        registry.deregister(orch.id);
      }
    } else if (inFlightPositionIds.has(knownPos.id)) {
      logger.info(
        `[Discovery] Position ${knownPos.id} is not on-chain but has an active rebalance task. Retaining orchestrator.`
      );
      // Ensure orchestrator is registered and marked as executing
      const activeOrchestrators = registry.getForPosition(knownPos.id);
      if (activeOrchestrators.length === 0) {
        const matchingAssignments = assignments.filter((a) => a.positionId === knownPos.id);
        for (const assignment of matchingAssignments) {
          const orchestrator = factory.create(assignment);
          orchestrator.isExecuting = true;
          registry.register(orchestrator);
        }
      } else {
        for (const orch of activeOrchestrators) {
          orch.isExecuting = true;
        }
      }
    }
  }

  // 4. Update local tracking store
  if (!isDeepStrictEqual(knownPositions, livePositions)) {
    logger.info('[Discovery] Positions changed on-chain compared to cached. Persisting updated cache...');
    await positionStore.saveKnown(livePositions);
  } else {
    logger.info('[Discovery] Cached positions match on-chain positions. Disk write skipped.');
  }
  logger.info('[Discovery] Discovery cycle finalized successfully.');
}

/**
 * Execution Monitor: reads the Task Store and drives the transaction lifecycle.
 */
export async function processTasks(
  store: IStore,
  executor: IExecutor,
  positionProvider: IPositionProvider,
  rpcPool: IRpcProvider,
  walletAddress: string,
  registry: IOrchestratorRegistry,
  positionStore: IPositionStore
): Promise<void> {
  const tasksStore = store as unknown as {
    getTasks: () => Promise<RebalanceTask[]>;
    saveTask: (t: RebalanceTask) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
  };
  if (typeof tasksStore.getTasks !== 'function') return;

  const tasks: RebalanceTask[] = await tasksStore.getTasks();
  if (tasks.length === 0) return;

  logger.info(`[Execution Monitor] Found ${tasks.length} active task(s) in task store.`);

  const processingPromises = tasks.map(async (task) => {
    try {
      logger.info(`[Execution Monitor] Processing task ${task.id} (${task.status}) for position ${task.originalPositionId}`);

      // Ensure events array is initialized
      if (!task.events) {
        task.events = [];
      }

      // 1. Sync orchestrator isExecuting flag
      const orchestrators = registry.getForPosition(task.originalPositionId);
      for (const orch of orchestrators) {
        orch.isExecuting = true;
      }

      // 2. Timeout check (fail-safe)
      const MAX_TASK_AGE_MS = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - task.evaluatedAt > MAX_TASK_AGE_MS) {
        logger.error(
          `[Execution Monitor] [ALERT] RebalanceTask ${task.id} has been active for over 5 minutes. Idle capital warning!`
        );
        if (!task.events.some((e) => e.stage === 'TIMEOUT')) {
          task.events.push({
            stage: 'TIMEOUT',
            timestamp: Date.now(),
            message: `Task has exceeded maximum age of ${MAX_TASK_AGE_MS}ms.`,
          });
          await tasksStore.saveTask(task);
        }
      }

      if (task.status === 'pending_close') {
        const poolAddress = task.intent.openParams?.poolAddress || task.intent.positionId;
        const poolInfo = await positionProvider.getPoolInfo(poolAddress);
        const market = await positionProvider.getMarketSnapshot(poolInfo.poolAddress);

        // Fetch initial balances to detect changes/increases later
        const initialBalances = await rpcPool.execute(async (connection: Connection) => {
          logger.info('Wallet: ' + walletAddress + ' ' + poolInfo.tokenXAddress + ' ' + poolInfo.tokenYAddress);
          return await getWalletBalances(connection, walletAddress, poolInfo.tokenXAddress, poolInfo.tokenYAddress);
        });

        logger.info(`[Execution Monitor] Executing CLOSE transaction for task ${task.id}...`);
        const closeDecision: Decision = {
          ...task.intent,
          action: 'close' as const,
        };

        // --- Log CLOSE_BROADCAST ---
        task.events.push({
          stage: 'CLOSE_BROADCAST',
          timestamp: Date.now(),
          message: `Broadcasting close transaction for position ${task.originalPositionId}`,
        });
        await tasksStore.saveTask(task);

        let record;
        try {
          record = await executor.apply(closeDecision, market, async () => {
            return { action: 'skip' };
          });
          if (record.status === 'failed') {
            if (
              record.error &&
              (record.error.includes('not found on-chain') || record.error.includes('Cannot close position'))
            ) {
              logger.warn(
                `[Execution Monitor] Position ${task.originalPositionId} was not found on-chain (already closed). Proceeding with rebalance flow.`
              );
              record = { status: 'success' as const, txSignatures: [] };
            } else {
              throw new Error(`Close transaction failed: ${record.error}`);
            }
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('not found on-chain') || msg.includes('Cannot close position')) {
            logger.warn(
              `[Execution Monitor] Position ${task.originalPositionId} was not found on-chain (already closed). Proceeding with rebalance flow.`
            );
            record = { status: 'success' as const, txSignatures: [] };
          } else {
            task.events.push({
              stage: 'ERROR',
              timestamp: Date.now(),
              message: `Close transaction failed: ${msg}`,
              error: msg,
            });
            await tasksStore.saveTask(task);
            throw err;
          }
        }

        // --- Log CLOSE_CONFIRMED ---
        task.events.push({
          stage: 'CLOSE_CONFIRMED',
          timestamp: Date.now(),
          message: `Close transaction confirmed. Signatures: ${record.txSignatures?.join(', ') || 'none'}`,
          txSignature: record.txSignatures?.[0],
        });
        await tasksStore.saveTask(task);

        // Scenario C: Pure Close completes immediately
        if (task.intent.action === 'close') {
          task.events.push({
            stage: 'COMPLETED',
            timestamp: Date.now(),
            message: 'Pure close task completed successfully.',
          });
          await tasksStore.saveTask(task);
          await tasksStore.deleteTask(task.id);
          for (const orch of orchestrators) {
            orch.isExecuting = false;
          }
          return;
        }

        logger.info(`[Execution Monitor] Close transaction completed. Polling balances for settlement...`);
        // --- Log SETTLEMENT_POLLING ---
        task.events.push({
          stage: 'SETTLEMENT_POLLING',
          timestamp: Date.now(),
          message: 'Starting polling for balance settlement...',
        });
        await tasksStore.saveTask(task);

        const solanaExecutor = executor as unknown as {
          pollBalances?: (tx: string, ty: string, w: string, ix: bigint, iy: bigint) => Promise<void>;
        };
        if (solanaExecutor.pollBalances) {
          await solanaExecutor.pollBalances(
            poolInfo.tokenXAddress,
            poolInfo.tokenYAddress,
            walletAddress,
            BigInt(initialBalances.amountX),
            BigInt(initialBalances.amountY)
          );
        }

        // --- Log SETTLEMENT_DETECTED ---
        task.events.push({
          stage: 'SETTLEMENT_DETECTED',
          timestamp: Date.now(),
          message: 'Settlement detected and balances verified.',
        });

        task.status = 'awaiting_settlement';
        task.evaluatedAt = Date.now();
        await tasksStore.saveTask(task);
        logger.info(`[Execution Monitor] Task ${task.id} transitioned to 'awaiting_settlement'`);
        return;
      }

      if (task.status === 'awaiting_settlement') {
        const poolAddress = task.intent.openParams?.poolAddress || task.intent.positionId;
        const poolInfo = await positionProvider.getPoolInfo(poolAddress);
        const market = await positionProvider.getMarketSnapshot(poolInfo.poolAddress);

        // Fetch decimals from cached known positions
        const knownPositions = await positionStore.getKnown();
        const cachedPos = knownPositions.find((p) => p.id === task.originalPositionId);
        const decimalsX = cachedPos?.tokenX.decimals ?? 9;
        const decimalsY = cachedPos?.tokenY.decimals ?? 6;

        // Fetch fresh settled wallet balances
        const walletBalances = await rpcPool.execute(async (connection: Connection) => {
          return await getWalletBalances(connection, walletAddress, poolInfo.tokenXAddress, poolInfo.tokenYAddress);
        });

        logger.info(
          `[Execution Monitor] Synthesizing Position with wallet balances: X=${walletBalances.amountX}, Y=${walletBalances.amountY}`
        );

        // Build synthetic position using pre-closure metadata and live balances
        const syntheticPos: Position = {
          id: task.originalPositionId,
          poolAddress: poolInfo.poolAddress,
          chain: 'solana' as const,
          protocol: 'meteora_dlmm' as const,
          lowerBound: task.intent.openParams?.lowerBound || 0,
          upperBound: task.intent.openParams?.upperBound || 0,
          tokenX: {
            tokenAddress: poolInfo.tokenXAddress,
            mint: poolInfo.tokenXAddress,
            decimals: decimalsX,
            amount: walletBalances.amountX,
          },
          tokenY: {
            tokenAddress: poolInfo.tokenYAddress,
            mint: poolInfo.tokenYAddress,
            decimals: decimalsY,
            amount: walletBalances.amountY,
          },
          isInRange: true,
          openedAt: Date.now(),
          metadata: {},
        };

        let openParamsToUse = task.intent.openParams;

        // --- Log JIT_REEVALUATION ---
        task.events.push({
          stage: 'JIT_REEVALUATION',
          timestamp: Date.now(),
          message: 'Performing Just-In-Time evaluation on synthetic position...',
        });
        await tasksStore.saveTask(task);

        logger.info(`[Execution Monitor] Re-evaluating strategy using synthetic position...`);
        let reEvalResult: StrategyResult = { action: 'skip' };
        try {
          for (const orch of orchestrators) {
            const res = await orch.tick(syntheticPos, market);
            if (res.action !== 'skip') {
              reEvalResult = res;
              break;
            }
          }
        } catch (err) {
          logger.error(
            `[Execution Monitor] Strategy re-evaluation failed: ${
              err instanceof Error ? err.message : String(err)
            }. Falling back to predefined open parameters.`
          );
        }

        if (reEvalResult.action === 'open' || reEvalResult.action === 'close+open') {
          const openParams = reEvalResult.action === 'close+open' ? reEvalResult.openParams : reEvalResult.params;
          if (openParams) {
            openParamsToUse = openParams;
            logger.info(`[Execution Monitor] Strategy re-evaluation successfully recalculated new range bounds.`);
          }
        } else if (orchestrators.length > 0 && reEvalResult.action === 'skip') {
          openParamsToUse = undefined;
          logger.info(`[Execution Monitor] Strategy re-evaluation recommended 'skip'. Aborting open leg.`);
        }

        if (openParamsToUse) {
          task.intent.openParams = openParamsToUse;
          task.intent.action = 'open';
          task.status = 'pending_open';
          task.evaluatedAt = Date.now();
          await tasksStore.saveTask(task);
          logger.info(`[Execution Monitor] Task ${task.id} updated with open params (status: pending_open)`);
          return;
        } else {
          logger.info(
            `[Execution Monitor] No predefined open parameters and strategy re-evaluation recommended 'skip'. Deleting task and unlocking orchestrator.`
          );
          // --- Log JIT_SKIPPED ---
          task.events.push({
            stage: 'JIT_SKIPPED',
            timestamp: Date.now(),
            message: 'Strategy re-evaluation recommended skip. Skipping open leg.',
          });
          task.events.push({
            stage: 'COMPLETED',
            timestamp: Date.now(),
            message: 'Rebalance task aborted due to JIT skip.',
          });
          await tasksStore.saveTask(task);
          await tasksStore.deleteTask(task.id);
          for (const orch of orchestrators) {
            orch.isExecuting = false;
          }
        }
      }

      if (task.status === 'pending_open') {
        const poolAddress = task.intent.openParams?.poolAddress || task.intent.positionId;
        const poolInfo = await positionProvider.getPoolInfo(poolAddress);
        const market = await positionProvider.getMarketSnapshot(poolInfo.poolAddress);

        // JIT Signal Validation: check if signal is stale (e.g., > 10,000ms)
        const MAX_SIGNAL_AGE_MS = 10000;
        if (Date.now() - task.evaluatedAt > MAX_SIGNAL_AGE_MS) {
          logger.warn(
            `[Execution Monitor] Signal for task ${task.id} is stale (${Date.now() - task.evaluatedAt}ms). Re-triggering re-evaluation...`
          );
          task.status = 'awaiting_settlement';
          await tasksStore.saveTask(task);
          return;
        }

        logger.info(`[Execution Monitor] Executing OPEN transaction for task ${task.id}...`);
        // --- Log OPEN_BROADCAST ---
        task.events.push({
          stage: 'OPEN_BROADCAST',
          timestamp: Date.now(),
          message: `Broadcasting open transaction with params: ${JSON.stringify(task.intent.openParams)}`,
        });
        await tasksStore.saveTask(task);

        let record;
        try {
          record = await executor.apply(task.intent, market, async () => {
            return { action: 'skip' };
          });
          if (record.status === 'failed') {
            throw new Error(`Open transaction failed: ${record.error}`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          task.events.push({
            stage: 'ERROR',
            timestamp: Date.now(),
            message: `Open transaction failed: ${msg}`,
            error: msg,
          });
          await tasksStore.saveTask(task);
          throw err;
        }

        await store.saveExecutionRecord(record);

        logger.info(`[Execution Monitor] 🎉 SUCCESS: RebalanceTask ${task.id} has successfully completed!`);
        logger.info(
          `[Execution Monitor] Transmitted transaction signature(s): ${record.txSignatures?.join(', ') || 'none'}`
        );
        logger.info(
          `[Execution Monitor] The next on-chain position discovery cycle will automatically register and track the newly created position.`
        );

        // --- Log OPEN_CONFIRMED ---
        task.events.push({
          stage: 'OPEN_CONFIRMED',
          timestamp: Date.now(),
          message: `Open transaction confirmed. Signatures: ${record.txSignatures?.join(', ') || 'none'}`,
          txSignature: record.txSignatures?.[0],
        });
        // --- Log COMPLETED ---
        task.events.push({
          stage: 'COMPLETED',
          timestamp: Date.now(),
          message: 'Rebalance task completed successfully.',
        });
        await tasksStore.saveTask(task);

        await tasksStore.deleteTask(task.id);
        for (const orch of orchestrators) {
          orch.isExecuting = false;
        }
      }
    } catch (err: unknown) {
      logger.error(
        `[Execution Monitor] Error processing task ${task.id}: ${
          err instanceof Error ? err.stack || err.message : String(err)
        }`
      );
    }
  });

  await Promise.all(processingPromises);
}

/**
 * Starts the continuous tick loop for all registered orchestrators.
 *
 * @param {number} intervalMs - Tick interval in milliseconds.
 * @param {string} walletAddress - Wallet address (for RPC calls).
 * @param {IPositionProvider} positionProvider - On-chain data fetching.
 * @param {IPositionStore} positionStore - Known position cache.
 * @param {IOrchestratorRegistry} registry - Active orchestrators to tick.
 * @param {IExecutionGate} executionGate - Decision filter before executor.
 * @param {IExecutor} executor - Transaction executor.
 * @param {IStore} store - Persists execution records.
 * @returns {NodeJS.Timeout} Interval handle for cancellation.
 */
export function startTickLoop(
  intervalMs: number,
  walletAddress: string,
  positionProvider: IPositionProvider,
  positionStore: IPositionStore,
  registry: IOrchestratorRegistry,
  executionGate: IExecutionGate,
  executor: IExecutor,
  store: IStore,
  rpcPool: IRpcProvider
): NodeJS.Timeout {
  logger.info(
    `[Tick Loop] Launching continuous evaluation tick loop for wallet ${walletAddress}. Interval: ${intervalMs}ms`
  );

  let isRunning = false;
  const loop = setInterval(async () => {
    if (isRunning) {
      let activeTasksInfo = '';
      try {
        const tasks = await store.getTasks();
        if (tasks && tasks.length > 0) {
          activeTasksInfo = ` (Active tasks in flight: ${tasks.map((t) => `${t.id} [${t.status}] for position ${t.originalPositionId || t.intent.positionId}`).join(', ')})`;
        }
      } catch {
        /* ignore */
      }
      logger.info(`[Tick Loop] Previous execution cycle is still active. Skipping overlapping tick loop.${activeTasksInfo}`);
      return;
    }
    isRunning = true;
    try {
      logger.info('[Tick Loop] Starting tick execution cycle...');

      // 1. Run Execution Monitor to process in-flight stateful tasks first
      await processTasks(store, executor, positionProvider, rpcPool, walletAddress, registry, positionStore);

      const knownPositions = await positionStore.getKnown();
      const updatedKnownPositions: Position[] = [...knownPositions];
      let storeNeedsUpdate = false;

      for (const position of knownPositions) {
        try {
          const chain = position.chain || 'solana';
          logger.info(`[Tick Loop] Evaluating position ${position.id} on chain [${chain}]`);

          if (chain !== 'solana') {
            logger.info(
              `[Tick Loop] Position ${position.id} is on chain ${chain} (EVM/Uniswap execution is pending Phase B). Skipping evaluation.`
            );
            continue;
          }

          // Fetch orchestrators and check lock before querying RPC to avoid useless RPC workload
          const orchestrators = registry.getForPosition(position.id);
          if (orchestrators.some((o) => o.isExecuting)) {
            logger.info(
              `[Tick Loop] Position ${position.id} is currently locked (active rebalance task in-flight). Skipping evaluation.`
            );
            continue;
          }

          // Fetch fresh status and snapshot
          let freshPosition: Position;
          try {
            freshPosition = await positionProvider.getPosition(position.id, position.poolAddress);
          } catch (getPosError: unknown) {
            if (getPosError instanceof Error && getPosError.message.includes('not found')) {
              logger.warn(
                `[Tick Loop] Position ${position.id} was not found on-chain. Pruning from local cache and registry.`
              );
              // Deregister from registry
              const activeOrchs = registry.getForPosition(position.id);
              for (const orch of activeOrchs) {
                registry.deregister(orch.id);
              }
              // Remove from updated known list
              const index = updatedKnownPositions.findIndex((p) => p.id === position.id);
              if (index >= 0) {
                updatedKnownPositions.splice(index, 1);
                storeNeedsUpdate = true;
              }
              continue;
            }
            throw getPosError;
          }

          // Deep compare old state vs fresh state
          if (!isDeepStrictEqual(position, freshPosition)) {
            logger.info(`[Tick Loop] State change detected for position ${position.id}. Updating cache.`);
            const idx = updatedKnownPositions.findIndex((p) => p.id === position.id);
            if (idx >= 0) {
              updatedKnownPositions[idx] = freshPosition;
              storeNeedsUpdate = true;
            }
          }

          const market = await positionProvider.getMarketSnapshot(freshPosition.poolAddress);

          logger.info(
            `[Tick Loop] Position ${position.id} details: Pool Price: ${market.price} | Bounds: [${freshPosition.lowerBound}, ${freshPosition.upperBound}] | In-Range: ${freshPosition.isInRange}`
          );

          const activeResults: Recommendation[] = [];

          for (const orch of orchestrators) {
            try {
              const result = await orch.tick(freshPosition, market);
              if (result.action !== 'skip' && orch.mode === 'active') {
                activeResults.push({ assignmentId: orch.assignmentId, result });
              }
            } catch (orchError: unknown) {
              logger.error(
                `[Tick Loop] Orchestrator ${orch.id} failed tick: ${
                  orchError instanceof Error ? orchError.message : String(orchError)
                }`
              );
            }
          }

          // Pass active recommendations through execution gate
          const decision: Decision | null = executionGate.consider(activeResults, freshPosition.id);

          if (decision) {
            logger.info(`[Tick Loop] Executable decision gated. Creating stateful RebalanceTask...`);

            // Create the write-ahead persistent task
            const tasksStore = store as unknown as {
              saveTask: (t: RebalanceTask) => Promise<void>;
            };
            const task: RebalanceTask = {
              id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              assignmentId: decision.sourceAssignmentId,
              status: decision.action === 'open' ? 'pending_open' : 'pending_close',
              originalPositionId: decision.positionId,
              intent: decision,
              evaluatedAt: decision.evaluatedAt || Date.now(),
              events: [
                {
                  stage: 'INIT',
                  timestamp: Date.now(),
                  message: `Task initialized for action: ${decision.action}`,
                },
              ],
            };

            await tasksStore.saveTask(task);

            // Set the execution lock on all associated orchestrators
            for (const orch of orchestrators) {
              orch.isExecuting = true;
            }

            logger.info(
              `[Tick Loop] Stateful RebalanceTask ${task.id} created successfully on disk. Triggering Execution Monitor...`
            );

            // Run Task Monitor immediately to begin execution without waiting for next tick interval
            await processTasks(store, executor, positionProvider, rpcPool, walletAddress, registry, positionStore);
          } else {
            logger.info(`[Tick Loop] No execution required for position ${position.id}`);
          }
        } catch (posError: unknown) {
          logger.error(
            `[Tick Loop] Error evaluating position ${position.id}: ${
              posError instanceof Error ? posError.message : String(posError)
            }`
          );
        }
      }

      if (storeNeedsUpdate) {
        logger.info(`[Tick Loop] Saving updated known positions cache...`);
        await positionStore.saveKnown(updatedKnownPositions);
      }
    } catch (error: unknown) {
      logger.error(
        `[Tick Loop] Fatal error during tick execution cycle: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      isRunning = false;
    }
  }, intervalMs);

  return loop;
}
