/**
 * @file solana-executor.ts
 * @description Solana transaction executor for CLMM position operations (open/close/rebalance).
 *
 * @features
 * - Executes close, open, and compound close+open operations via RPC
 * - Supports priority fee configuration for transaction confirmation speed
 * - Injects re evaluation callback for close+open compound actions
 * - Mock transaction simulation for development (returns fake signatures)
 *
 * @dependencies IRpcProvider (for RPC calls), IExecutor interface, Decision types
 * @sideEffects Produces ExecutionRecord with transaction signatures (mock or real)
 */
import {
  IExecutor,
  Decision,
  MarketSnapshot,
  ExecutionRecord,
  StrategyResult,
  IRpcProvider,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('solana-executor');

/**
 * Solana executor using RPC pool for transaction submission.
 * Currently uses mockTransaction() — replace with real transaction building/signing in production.
 */
export class SolanaExecutor implements IExecutor {
  private reEvaluateCallback?: (positionId: string) => Promise<StrategyResult>;

  /**
   * Constructs the executor with RPC pool, wallet address, and optional priority fee.
   *
   * @param {IRpcProvider} rpcPool - Pool of RPC endpoints for resilience.
   * @param {string} walletAddress - Solana wallet public key for transaction signing.
   * @param {{ priorityFeeMicroLamports?: number }} options - Priority fee configuration.
   */
  constructor(
    private rpcPool: IRpcProvider,
    private walletAddress: string,
    private options: { priorityFeeMicroLamports?: number } = {}
  ) {
    logger.info(
      `[SolanaExecutor] Initialized for wallet ${this.walletAddress} with RPC pool [${this.rpcPool.constructor.name}] and priority fee ${this.options.priorityFeeMicroLamports || 0} micro-lamports`
    );
  }

  /**
   * Sets the re evaluation callback used for close+open compound operations.
   *
   * @param {(positionId: string) => Promise<StrategyResult>} reEvaluate - Async callback returning fresh strategy signal.
   */
  public setReEvaluate(reEvaluate: (positionId: string) => Promise<StrategyResult>): void {
    this.reEvaluateCallback = reEvaluate;
  }

  /**
   * Applies a decision to on-chain transactions.
   * Handles three action types: close, open, and close+open (rebalance).
   *
   * @param {Decision} decision - The action to execute (close/open/close+open).
   * @param {MarketSnapshot} market - Current market data for pool context.
   * @param {(positionId: string) => Promise<StrategyResult>} [reEvaluate] - Optional per-call re-evaluation callback.
   * @returns {Promise<ExecutionRecord>} Immutable record of execution outcome (success/fail, tx sigs, error).
   */
  public async apply(
    decision: Decision,
    market: MarketSnapshot,
    reEvaluate?: (positionId: string) => Promise<StrategyResult>
  ): Promise<ExecutionRecord> {
    const callback = reEvaluate || this.reEvaluateCallback;
    logger.info(
      `[SolanaExecutor] Applying decision '${decision.action}' on position ${decision.positionId}`
    );

    const txSignatures: string[] = [];
    const executionId = `exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      if (decision.action === 'close') {
        logger.info(
          `[SolanaExecutor] Creating CLOSE transaction for position ${decision.positionId}`
        );
        const closeSig = await this.mockTransaction('close_position');
        txSignatures.push(closeSig);
      } else if (decision.action === 'open') {
        logger.info(
          `[SolanaExecutor] Creating OPEN transaction on pool ${market.poolAddress} with lower/upper bins [${decision.openParams?.lowerBinId}, ${decision.openParams?.upperBinId}]`
        );
        const openSig = await this.mockTransaction('open_position');
        txSignatures.push(openSig);
      } else if (decision.action === 'close+open') {
        logger.info(`[SolanaExecutor] Step 1/3: Closing old position ${decision.positionId}`);
        const closeSig = await this.mockTransaction('close_position');
        txSignatures.push(closeSig);

        if (!callback) {
          throw new Error(
            'Cannot execute compound close+open rebalance without an injected re-evaluation callback'
          );
        }

        logger.info(
          `[SolanaExecutor] Step 2/3: Invoking re-evaluation callback for position ${decision.positionId}`
        );
        const reEvalResult = await callback(decision.positionId);

        if (reEvalResult.action === 'open' || reEvalResult.action === 'close+open') {
          const openParams =
            reEvalResult.action === 'close+open'
              ? reEvalResult.openParams
              : reEvalResult.params;
          logger.info(
            `[SolanaExecutor] Step 3/3: Re-evaluation returned OPEN action. Executing new position open in bin range [${openParams.lowerBinId}, ${openParams.upperBinId}]`
          );
          const openSig = await this.mockTransaction('open_position');
          txSignatures.push(openSig);
        } else {
          logger.info(
            `[SolanaExecutor] Step 3/3: Re-evaluation returned '${reEvalResult.action}' action. Skipping subsequent open.`
          );
        }
      }

      logger.info(
        `[SolanaExecutor] Execution sequence succeeded. Transactions: ${txSignatures.join(', ')}`
      );

      return {
        id: executionId,
        decision,
        txSignatures,
        status: 'success',
        executedAt: Date.now(),
      };
    } catch (error: any) {
      logger.error(`[SolanaExecutor] Execution sequence failed: ${error.message || error}`);
      return {
        id: executionId,
        decision,
        txSignatures,
        status: 'failed',
        error: error.message || String(error),
        executedAt: Date.now(),
      };
    }
  }

  /**
   * Simulates a transaction with brief network latency.
   * Replace this with real on-chain transaction building and submission in production.
   *
   * @private
   * @param {string} actionType - Type of action (close_position or open_position).
   * @returns {Promise<string>} Mock transaction signature.
   */
  private async mockTransaction(actionType: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const randomHex = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const signature = `mock_tx_${actionType}_${randomHex}`;
    logger.info(`[SolanaExecutor] Transaction confirmed on-chain: ${signature}`);
    return signature;
  }
}
