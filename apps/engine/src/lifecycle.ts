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
  IRpcProvider,
  Recommendation,
  Decision,
  Position,
} from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';

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

  const tokenProgramId = new PublicKey('TokenkegQfeZyiNWxFb9eeB2m3tFhGE5IBgxYvhFr1i');
  const token2022ProgramId = new PublicKey('TokenzQhb8NsH26e8m1Yg9UP9Kaj15saWJ361v27m1');

  const fetchForProgram = async (programId: PublicKey) => {
    try {
      const response = await connection.getParsedTokenAccountsByOwner(
        new PublicKey(walletAddress),
        { programId }
      );
      for (const account of response.value) {
        const info = account.account.data.parsed.info;
        const mint = info.mint;
        const amount = info.tokenAmount.amount; // raw string format

        if (mint === mintX) {
          amountX = amount;
        } else if (mint === mintY) {
          amountY = amount;
        }
      }
    } catch (err: unknown) {
      logger.warn(
        `[getWalletBalances] Failed to fetch token accounts for program ${programId.toBase58()}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
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
  store: IStore,
  rpcPool: IRpcProvider
): NodeJS.Timeout {
  logger.info(
    `[Tick Loop] Launching continuous evaluation tick loop for wallet ${walletAddress}. Interval: ${intervalMs}ms`
  );

  const loop = setInterval(async () => {
    try {
      logger.info('[Tick Loop] Starting tick execution cycle...');
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

          // Fetch fresh status and snapshot
          let freshPosition: Position;
          try {
            freshPosition = await positionProvider.getPosition(
              position.id,
              position.poolAddress
            );
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

          const market = await positionProvider.getMarketSnapshot(freshPosition.poolAddress);

          const orchestrators = registry.getForPosition(freshPosition.id);

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
          const decision: Decision | null = executionGate.consider(
            activeResults,
            freshPosition.id
          );

          if (decision) {
            logger.info(`[Tick Loop] Executable decision gated. Dispatched to executor...`);
            // SolanaExecutor uses RpcPool for Connection. We pass our global executor apply.
            const record = await executor.apply(decision, market, async (posId: string) => {
              logger.info(`[Re-Evaluation Callback] Initiated for position: ${posId}`);

              // Get the live token balances for X and Y from the wallet
              const poolInfo = await positionProvider.getPoolInfo(freshPosition.poolAddress);

              // Query RPC for wallet token balances
              const walletBalances = await rpcPool.execute(async (connection: Connection) => {
                return await getWalletBalances(
                  connection,
                  walletAddress,
                  poolInfo.tokenXAddress,
                  poolInfo.tokenYAddress
                );
              });

              logger.info(
                `[Re-Evaluation Callback] Fetched wallet balances for rebalance. Token X: ${walletBalances.amountX}, Token Y: ${walletBalances.amountY}`
              );

              // Construct synthetic position using pre-closure metadata and fresh wallet balances
              const syntheticPos: Position = {
                ...freshPosition,
                tokenX: {
                  ...freshPosition.tokenX,
                  amount: walletBalances.amountX,
                },
                tokenY: {
                  ...freshPosition.tokenY,
                  amount: walletBalances.amountY,
                },
                isInRange: true,
              };

              const updatedMarket = await positionProvider.getMarketSnapshot(
                freshPosition.poolAddress
              );
              const activeOrchs = registry.getForPosition(posId);

              for (const o of activeOrchs) {
                const res = await o.tick(syntheticPos, updatedMarket);
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
        `[Tick Loop] Fatal error during tick execution cycle: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }, intervalMs);

  return loop;
}
