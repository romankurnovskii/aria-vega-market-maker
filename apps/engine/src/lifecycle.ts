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
import {
  IPositionProvider,
  IPositionStore,
  IStore,
  IOrchestratorRegistry,
  IExecutionGate,
  IExecutor,
  Recommendation,
  Decision,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('lifecycle');

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

  // 1. Fetch live positions and known persisted positions
  const livePositions = await positionProvider.getPositions(walletAddress);
  const knownPositions = await positionStore.getKnown();
  const assignments = await store.getAssignments();

  const liveIds = new Set(livePositions.map((p) => p.id));
  const knownIds = new Set(knownPositions.map((p) => p.id));

  // 2. Identify new positions
  for (const livePos of livePositions) {
    if (!knownIds.has(livePos.id)) {
      logger.info(`[Discovery] Discovered new live position: ${livePos.id}`);

      // Match with stored assignments
      const matchingAssignments = assignments.filter((a) => a.positionId === livePos.id);
      for (const assignment of matchingAssignments) {
        const orchestrator = factory.create(assignment);
        registry.register(orchestrator);
      }
    }
  }

  // 3. Identify closed/removed positions
  for (const knownPos of knownPositions) {
    if (!liveIds.has(knownPos.id)) {
      logger.info(`[Discovery] Known position ${knownPos.id} is no longer on-chain. Pruning.`);

      const activeOrchestrators = registry.getForPosition(knownPos.id);
      for (const orch of activeOrchestrators) {
        registry.deregister(orch.id);
      }
    }
  }

  // 4. Update local tracking store
  await positionStore.saveKnown(livePositions);
  logger.info('[Discovery] Discovery cycle finalized successfully.');
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
  store: IStore
): NodeJS.Timeout {
  logger.info(
    `[Tick Loop] Launching continuous evaluation tick loop for wallet ${walletAddress}. Interval: ${intervalMs}ms`
  );

  const loop = setInterval(async () => {
    try {
      logger.info('[Tick Loop] Starting tick execution cycle...');
      const knownPositions = await positionStore.getKnown();

      for (const position of knownPositions) {
        const chain = position.chain || 'solana';
        logger.info(`[Tick Loop] Evaluating position ${position.id} on chain [${chain}]`);

        // Fetch fresh status and snapshot
        const freshPosition = await positionProvider.getPosition(
          position.id,
          position.poolAddress
        );
        const market = await positionProvider.getMarketSnapshot(freshPosition.poolAddress);

        if (chain !== 'solana') {
          logger.info(
            `[Tick Loop] Position ${position.id} is on chain ${chain} (EVM/Uniswap execution is pending Phase B). Skipping evaluation.`
          );
          continue;
        }

        const orchestrators = registry.getForPosition(freshPosition.id);

        const activeResults: Recommendation[] = [];

        for (const orch of orchestrators) {
          try {
            const result = await orch.tick(freshPosition, market);
            if (result.action !== 'skip' && orch.mode === 'active') {
              activeResults.push({ assignmentId: orch.assignmentId, result });
            }
          } catch (orchError: any) {
            logger.error(
              `[Tick Loop] Orchestrator ${orch.id} failed tick: ${orchError.message || orchError}`
            );
          }
        }

        // Pass active recommendations through execution gate
        const decision: Decision | null = executionGate.consider(
          activeResults,
          freshPosition.id
        );

        if (decision) {
          logger.info(`[Tick Loop] Executable decision gated. Dispatched to executor...`);
          // SolanaExecutor uses RpcPool for Connection. We pass our global executor apply.
          const record = await executor.apply(decision, market, async (posId: string) => {
            logger.info(`[Re-Evaluation Callback] Initiated for position: ${posId}`);
            const updatedPos = await positionProvider.getPosition(
              posId,
              freshPosition.poolAddress
            );
            const updatedMarket = await positionProvider.getMarketSnapshot(
              updatedPos.poolAddress
            );
            const activeOrchs = registry.getForPosition(posId);

            for (const o of activeOrchs) {
              const res = await o.tick(updatedPos, updatedMarket);
              if (res.action !== 'skip') {
                return res;
              }
            }
            return { action: 'skip' };
          });

          await store.saveExecutionRecord(record);
        } else {
          logger.info(`[Tick Loop] No execution required for position ${position.id}`);
        }
      }
    } catch (error: any) {
      logger.error(
        `[Tick Loop] Fatal error during tick execution cycle: ${error.message || error}`
      );
    }
  }, intervalMs);

  return loop;
}
