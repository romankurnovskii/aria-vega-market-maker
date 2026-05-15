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
  Assignment,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';

import { isDeepStrictEqual } from 'node:util';

const logger = getLogger('lifecycle');

let tickLoopRunning = false;
let monitorInitialRun = true;

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
  let assignments = await store.getAssignments();

  const tasksStore = store as unknown as {
    getTasks?: () => Promise<RebalanceTask[]>;
    deleteTask?: (id: string) => Promise<void>;
  };
  let tasks = tasksStore.getTasks ? await tasksStore.getTasks() : [];

  // Recover tasks that finished opening but failed to clean up (newPositionId is set)
  for (const task of tasks) {
    if (task.newPositionId) {
      logger.info(
        `[Discovery] Recovered task ${task.id} with already-set newPositionId: ${task.newPositionId}. Registering new orchestrator and completing task.`
      );

      const matchingAssignment = assignments.find((a) => a.id === task.assignmentId);
      if (matchingAssignment) {
        matchingAssignment.positionId = task.newPositionId;
        await store.saveAssignment(matchingAssignment);
        logger.info(
          `[Discovery] Recovered assignment ${matchingAssignment.id} updated to target new position ${task.newPositionId}`
        );

        // Register the new orchestrator
        const orchestrator = factory.create(matchingAssignment);
        registry.register(orchestrator);
      }

      if (tasksStore.deleteTask) {
        await tasksStore.deleteTask(task.id);
        logger.info(`[Discovery] Cleaned up recovered task ${task.id}`);
      }
    }
  }

  // Reload assignments and tasks after recovery to work with clean state
  assignments = await store.getAssignments();
  tasks = tasksStore.getTasks ? await tasksStore.getTasks() : [];

  const liveIds = new Set(livePositions.map((p) => p.id));
  const knownIds = new Set(knownPositions.map((p) => p.id));
  const inFlightPositionIds = new Set<string>(tasks.map((t: RebalanceTask) => t.originalPositionId));

  // 2. Identify live positions and ensure their orchestrators are registered
  for (const livePos of livePositions) {
    if (!livePos.state) {
      livePos.state = 'OPEN';
    }

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
      let orchestrator = existingOrchs.find((o) => o.assignmentId === assignment.id);
      if (!orchestrator) {
        logger.info(
          `[Discovery] Registering orchestrator on startup for assignment ${assignment.id} (strategy: ${assignment.strategyId}) targeting position ${livePos.id}`
        );
        orchestrator = factory.create(assignment);
        registry.register(orchestrator);
      }
    }
  }

  // 3. Identify closed/removed positions
  for (const knownPos of knownPositions) {
    if (!liveIds.has(knownPos.id) && !inFlightPositionIds.has(knownPos.id)) {
      logger.info(`[Discovery] Known position ${knownPos.id} is no longer on-chain. Marking as CLOSED and archiving.`);

      knownPos.state = 'CLOSED';
      knownPos.closedAt = Date.now();
      await positionStore.archivePosition(knownPos);

      const activeOrchestrators = registry.getForPosition(knownPos.id);
      for (const orch of activeOrchestrators) {
        registry.deregister(orch.id);
      }
    } else if (inFlightPositionIds.has(knownPos.id)) {
      const task = tasks.find((t) => t.originalPositionId === knownPos.id);
      knownPos.state = task?.intent.action === 'close' ? 'CLOSING' : 'REBALANCING';
      logger.info(
        `[Discovery] Position ${knownPos.id} is not on-chain but has an active rebalance task. Retaining orchestrator and setting state to ${knownPos.state}.`
      );
      // Ensure orchestrator is registered
      const activeOrchestrators = registry.getForPosition(knownPos.id);
      if (activeOrchestrators.length === 0) {
        const matchingAssignments = assignments.filter((a) => a.positionId === knownPos.id);
        for (const assignment of matchingAssignments) {
          const orchestrator = factory.create(assignment);
          registry.register(orchestrator);
        }
      }
    }
  }

  // 4. Update local tracking store
  const positionsToPersist: Position[] = [];
  for (const livePos of livePositions) {
    if (!positionsToPersist.some((p) => p.id === livePos.id)) {
      positionsToPersist.push(livePos);
    }
  }
  for (const knownPos of knownPositions) {
    if (inFlightPositionIds.has(knownPos.id)) {
      if (!positionsToPersist.some((p) => p.id === knownPos.id)) {
        positionsToPersist.push(knownPos);
      }
    }
  }

  if (!isDeepStrictEqual(knownPositions, positionsToPersist)) {
    logger.info('[Discovery] Positions changed on-chain compared to cached. Persisting updated cache...');
    await positionStore.saveKnown(positionsToPersist);
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
  registry: IOrchestratorRegistry,
  factory?: OrchestratorFactory
): Promise<void> {
  const tasksStore = store as unknown as {
    getTasks: () => Promise<RebalanceTask[]>;
    saveTask: (t: RebalanceTask) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    getAssignments: () => Promise<Assignment[]>;
  };
  if (typeof tasksStore.getTasks !== 'function') return;

  const tasks: RebalanceTask[] = await tasksStore.getTasks();
  if (tasks.length === 0) return;

  logger.info(`[Execution Monitor] Found ${tasks.length} active task(s) in task store.`);

  // Boot Recovery: Revert stuck executing tasks to pending states on first run
  if (monitorInitialRun) {
    let recoveredCount = 0;
    for (const task of tasks) {
      if (task.status === 'executing_close') {
        task.status = 'pending_close';
        await tasksStore.saveTask(task);
        recoveredCount++;
      } else if (task.status === 'executing_open') {
        task.status = 'pending_open';
        await tasksStore.saveTask(task);
        recoveredCount++;
      }
    }
    if (recoveredCount > 0) {
      logger.info(`[Execution Monitor] Boot Recovery: Reverted ${recoveredCount} stuck task(s) to pending states.`);
    }
    monitorInitialRun = false;
  }

  for (const task of tasks) {
    try {
      // 1. Timeout check (fail-safe)
      const MAX_TASK_AGE_MS = 10 * 60 * 1000; // 10 minutes
      if (Date.now() - task.evaluatedAt > MAX_TASK_AGE_MS) {
        logger.error(`[Execution Monitor] Task ${task.id} timed out. Archiving.`);
        await tasksStore.deleteTask(task.id);
        continue;
      }

      // Leg 1: The Close
      if (task.status === 'pending_close') {
        // ATOMIC CLAIM
        try {
          task.status = 'executing_close';
          await tasksStore.saveTask(task);
          logger.info(`[Execution Monitor] Claimed task ${task.id} for close.`);
        } catch {
          logger.warn(`[Execution Monitor] Task ${task.id} already claimed.`);
          continue;
        }

        const poolAddress = task.intent.openParams?.poolAddress || task.intent.positionId;
        const market = await positionProvider.getMarketSnapshot(poolAddress);

        const closeDecision: Decision = { ...task.intent, action: 'close' as const };
        task.events.push({ stage: 'CLOSE_BROADCAST', timestamp: Date.now() });
        await tasksStore.saveTask(task);

        const record = await executor.apply(closeDecision, market);
        if (record.status === 'failed') {
          task.status = 'pending_close'; // Revert to allow retry
          task.events.push({ stage: 'ERROR', timestamp: Date.now(), error: record.error });
          await tasksStore.saveTask(task);
          continue;
        }

        task.events.push({ stage: 'CLOSE_CONFIRMED', timestamp: Date.now(), txSignature: record.txSignatures[0] });

        if (task.intent.action === 'close+open') {
          task.status = 'pending_open';
          await tasksStore.saveTask(task);
        } else {
          await tasksStore.deleteTask(task.id);
        }
        continue;
      }

      // Leg 2: The Open
      if (task.status === 'pending_open') {
        // ATOMIC CLAIM
        try {
          task.status = 'executing_open';
          await tasksStore.saveTask(task);
          logger.info(`[Execution Monitor] Claimed task ${task.id} for open.`);
        } catch {
          logger.warn(`[Execution Monitor] Task ${task.id} already claimed.`);
          continue;
        }

        const openPoolAddress = task.intent.openParams?.poolAddress || task.intent.positionId;
        const market = await positionProvider.getMarketSnapshot(openPoolAddress);
        const openIntent: Decision = { ...task.intent, action: 'open' };

        task.events.push({ stage: 'OPEN_BROADCAST', timestamp: Date.now() });
        await tasksStore.saveTask(task);

        const record = await executor.apply(openIntent, market);
        if (record.status === 'failed') {
          task.status = 'pending_open'; // Revert
          task.events.push({ stage: 'ERROR', timestamp: Date.now(), error: record.error });
          await tasksStore.saveTask(task);
          continue;
        }

        task.events.push({ stage: 'OPEN_CONFIRMED', timestamp: Date.now(), txSignature: record.txSignatures[0] });

        // Update assignments
        const assignments = await tasksStore.getAssignments();
        const matching = assignments.filter((a) => a.id === task.assignmentId);
        for (const a of matching) {
          a.positionId = record.newPositionId!;
          await store.saveAssignment(a);
          if (factory) registry.register(factory.create(a));
        }

        await tasksStore.deleteTask(task.id);
        logger.info(`[Execution Monitor] Task ${task.id} completed.`);
        continue;
      }
    } catch (err) {
      logger.error(`[Execution Monitor] Error processing task ${task.id}: ${err}`);
    }
  }
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
  rpcPool: IRpcProvider,
  factory?: OrchestratorFactory
): NodeJS.Timeout {
  logger.info(
    `[Tick Loop] Launching continuous evaluation tick loop for wallet ${walletAddress}. Interval: ${intervalMs}ms`
  );

  const runCycle = async () => {
    if (tickLoopRunning) {
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
    tickLoopRunning = true;
    try {
      logger.info('[Tick Loop] Starting tick execution cycle...');

      // 1. Run Position Discovery to synchronize local state with on-chain reality
      if (factory) {
        await startDiscovery(
          walletAddress,
          positionProvider,
          positionStore,
          factory,
          store,
          registry
        ).catch((err) => {
          logger.error(`[Tick Loop] Error in startDiscovery: ${err instanceof Error ? err.message : String(err)}`);
        });
      }

      // 2. Run Execution Monitor to process in-flight stateful tasks first
      await processTasks(store, executor, positionProvider, registry, factory).catch(
        (err) => {
          logger.error(`[Tick Loop] Error in processTasks: ${err instanceof Error ? err.message : String(err)}`);
        }
      );

      const activeTasks = await store.getTasks();

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

          // Fetch active tasks from store to check lock before querying RPC to avoid useless RPC workload
          const isLocked = activeTasks.some((t) => t.originalPositionId === position.id);
          if (isLocked) {
            logger.info(
              `[Tick Loop] Position ${position.id} is currently locked (active rebalance task in-flight). Skipping evaluation.`
            );
            continue;
          }

          const orchestrators = registry.getForPosition(position.id);

          // Fetch fresh status and snapshot
          let freshPosition: Position;
          if (position.state === 'REBALANCING') {
            logger.info(
              `[Tick Loop] Position ${position.id} is in REBALANCING state. Synthesizing position from wallet balances...`
            );
            const poolInfo = await positionProvider.getPoolInfo(position.poolAddress);
            const walletBalances = await rpcPool.execute(async (connection: Connection) => {
              return await getWalletBalances(connection, walletAddress, poolInfo.tokenXAddress, poolInfo.tokenYAddress);
            });
            freshPosition = {
              id: position.id,
              poolAddress: poolInfo.poolAddress,
              chain: 'solana',
              protocol: 'meteora_dlmm',
              lowerBound: position.lowerBound || 0,
              upperBound: position.upperBound || 0,
              tokenX: {
                tokenAddress: poolInfo.tokenXAddress,
                mint: poolInfo.tokenXAddress,
                decimals: position.tokenX.decimals,
                amount: walletBalances.amountX,
              },
              tokenY: {
                tokenAddress: poolInfo.tokenYAddress,
                mint: poolInfo.tokenYAddress,
                decimals: position.tokenY.decimals,
                amount: walletBalances.amountY,
              },
              isInRange: true,
              openedAt: position.openedAt || Date.now(),
              metadata: position.metadata || {},
              state: 'REBALANCING',
            };
          } else {
            try {
              freshPosition = await positionProvider.getPosition(position.id, position.poolAddress);
              if (!freshPosition.state) {
                freshPosition.state = 'OPEN';
              }
            } catch (getPosError: unknown) {
              if (getPosError instanceof Error && getPosError.message.includes('not found')) {
                const ageMs = Date.now() - (position.openedAt || 0);
                const INDEXING_GRACE_PERIOD_MS = 15 * 60 * 1000; // 15-minute grace period
                if (ageMs < INDEXING_GRACE_PERIOD_MS) {
                  logger.warn(
                    `[Tick Loop] Position ${position.id} not found by API, but was opened recently (${Math.floor(ageMs / 1000)}s ago). Skipping evaluation during indexing grace period.`
                  );
                  continue;
                }

                logger.warn(`[Tick Loop] Position ${position.id} was not found on-chain. Marking as CLOSED and archiving.`);

                position.state = 'CLOSED';
                position.closedAt = Date.now();
                await positionStore.archivePosition(position);

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
            const taskAction = position.state === 'REBALANCING' ? 'open' : decision.action;
            const task: RebalanceTask = {
              id: `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              assignmentId: decision.sourceAssignmentId,
              status: taskAction === 'open' ? 'pending_open' : 'pending_close',
              originalPositionId: decision.positionId,
              intent: { ...decision, action: taskAction },
              evaluatedAt: decision.evaluatedAt || Date.now(),
              events: [
                {
                  stage: 'INIT',
                  timestamp: Date.now(),
                  message: `Task initialized for action: ${taskAction}`,
                },
              ],
            };

            try {
              await tasksStore.saveTask(task);
            } catch (saveErr: unknown) {
              const msg = saveErr instanceof Error ? saveErr.message : String(saveErr);
              if (msg.includes('Atomicity Violation')) {
                logger.warn(
                  `[Tick Loop] Atomicity Violation detected during task creation for position ${position.id}: ${msg}. Bypassing duplicate execution.`
                );
                continue;
              }
              throw saveErr;
            }

            logger.info(
              `[Tick Loop] Stateful RebalanceTask ${task.id} created successfully on disk. Triggering Execution Monitor...`
            );

            // Run Task Monitor immediately to begin execution without waiting for next tick interval
            await processTasks(
              store,
              executor,
              positionProvider,
              registry,
              factory
            ).catch((err) => {
              logger.error(
                `[Tick Loop] Error in post-decision processTasks: ${err instanceof Error ? err.message : String(err)}`
              );
            });
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
      tickLoopRunning = false;
    }
  };

  // Run initial cycle immediately (synchronous boot recovery gate)
  logger.info('[Tick Loop] Executing immediate initial tick cycle on boot...');
  runCycle().catch((error) => {
    logger.error('[Tick Loop] Error in initial immediate tick execution cycle:', error);
  });

  const loop = setInterval(runCycle, intervalMs);
  return loop;
}

/**
 * Resets the module-level tick loop running state.
 * Useful for test teardown to prevent sequential tests from skipping.
 */
export function resetTickLoopState(): void {
  tickLoopRunning = false;
}
