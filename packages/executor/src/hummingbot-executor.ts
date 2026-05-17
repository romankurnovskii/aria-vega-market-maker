import { IExecutor, Decision, MarketSnapshot, ExecutionRecord, StrategyResult } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('hummingbot-executor');

/**
 * Hummingbot API executor for position operations.
 * Implements IExecutor by calling Hummingbot Gateway API.
 */
export class HummingbotExecutor implements IExecutor {
  private apiUrl: string;
  private walletAddress: string;
  private reEvaluateCallback?: (positionId: string) => Promise<StrategyResult>;

  /**
   * @param {string} apiUrl - Hummingbot API base URL (e.g., http://localhost:8000).
   * @param {string} walletAddress - The wallet address to use for executions.
   */
  constructor(apiUrl: string, walletAddress: string) {
    this.apiUrl = apiUrl || 'http://localhost:8000';
    this.walletAddress = walletAddress;
    logger.info(`[HummingbotExecutor] Initialized with API URL: ${this.apiUrl} and wallet: ${this.walletAddress}`);
  }

  /**
   * Sets the re-evaluation callback.
   */
  public setReEvaluate(reEvaluate: (positionId: string) => Promise<StrategyResult>): void {
    this.reEvaluateCallback = reEvaluate;
    logger.debug(`[HummingbotExecutor] Registered re-evaluation callback: ${!!this.reEvaluateCallback}`);
  }

  /**
   * Applies a decision to the Hummingbot API.
   * Currently only supports 'open' action.
   *
   * @param {Decision} decision - The action to execute.
   * @param {MarketSnapshot} market - Current market data.
   * @returns {Promise<ExecutionRecord>} Record of execution outcome.
   */
  public async apply(decision: Decision, market: MarketSnapshot): Promise<ExecutionRecord> {
    void market;
    logger.info(`[HummingbotExecutor] Applying decision '${decision.action}' on position ${decision.positionId}`);

    const executionId = `exec_hb_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const txSignatures: string[] = [];

    try {
      if (decision.action === 'open') {
        const openParams = decision.openParams;
        if (!openParams) {
          throw new Error('Cannot execute open decision: missing openParams');
        }

        logger.info(`[HummingbotExecutor] Creating OPEN position via Hummingbot API...`);

        // Map the payload according to the user's example
        const payload = {
          connector: 'meteora', // Default or derived
          network: 'solana-mainnet-beta', // Default or derived
          pool_address: openParams.poolAddress,
          lower_price: openParams.lowerBoundPrice ?? 0, // Fallback if not provided
          upper_price: openParams.upperBoundPrice ?? 0, // Fallback if not provided
          base_token_amount: Number(openParams.tokenXAmount) || 0,
          quote_token_amount: Number(openParams.tokenYAmount) || 0,
          slippage_pct: (openParams.metadata?.slippageTolerance as number) ?? 1,
          wallet_address: this.walletAddress,
          extra_params: {},
        };

        logger.info(`[HummingbotExecutor] Sending POST /gateway/clmm/open with payload: ${JSON.stringify(payload)}`);

        const response = await fetch(`${this.apiUrl}/gateway/clmm/open`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Hummingbot API failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        logger.info(`[HummingbotExecutor] Hummingbot API response: ${JSON.stringify(result)}`);

        // Assuming response contains a transaction signature or position ID
        const sig = result.tx_signature || result.signature || result.id || 'unknown_sig';
        txSignatures.push(sig);

        return {
          id: executionId,
          decision,
          txSignatures,
          status: 'success',
          executedAt: Date.now(),
          newPositionId: result.position_id || result.id, // Assuming it returns the new position ID
        };
      } else if (decision.action === 'close') {
        throw new Error('Close operation is not supported in this phase of Hummingbot integration.');
      } else {
        throw new Error(`Unsupported action: ${decision.action}`);
      }
    } catch (error) {
      const err = error as Error;
      logger.error(`[HummingbotExecutor] Execution failed: ${err.message || String(error)}`);
      return {
        id: executionId,
        decision,
        txSignatures,
        status: 'failed',
        error: err.message || String(error),
        executedAt: Date.now(),
      };
    }
  }
}
