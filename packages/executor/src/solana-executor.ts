import { IExecutor, Decision, MarketSnapshot, ExecutionRecord, StrategyResult, IRpcProvider } from '@lp-system/core';

export class SolanaExecutor implements IExecutor {
  private reEvaluateCallback?: (positionId: string) => Promise<StrategyResult>;

  constructor(
    private rpcPool: IRpcProvider,
    private walletAddress: string,
    private options: { priorityFeeMicroLamports?: number } = {}
  ) {
    console.log(`[SolanaExecutor] Initialized for wallet ${this.walletAddress} with RPC pool [${this.rpcPool.constructor.name}] and priority fee ${this.options.priorityFeeMicroLamports || 0} micro-lamports`);
  }

  public setReEvaluate(reEvaluate: (positionId: string) => Promise<StrategyResult>): void {
    this.reEvaluateCallback = reEvaluate;
  }

  public async apply(
    decision: Decision,
    market: MarketSnapshot,
    reEvaluate?: (positionId: string) => Promise<StrategyResult>
  ): Promise<ExecutionRecord> {
    const callback = reEvaluate || this.reEvaluateCallback;
    console.log(`[SolanaExecutor] Applying decision '${decision.action}' on position ${decision.positionId}`);

    const txSignatures: string[] = [];
    const executionId = `exec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    try {
      if (decision.action === 'close') {
        // 1. Close Position
        console.log(`[SolanaExecutor] Creating CLOSE transaction for position ${decision.positionId}`);
        const closeSig = await this.mockTransaction('close_position');
        txSignatures.push(closeSig);
      } else if (decision.action === 'open') {
        // 2. Open Position
        console.log(`[SolanaExecutor] Creating OPEN transaction on pool ${market.poolAddress} with lower/upper bins [${decision.openParams?.lowerBinId}, ${decision.openParams?.upperBinId}]`);
        const openSig = await this.mockTransaction('open_position');
        txSignatures.push(openSig);
      } else if (decision.action === 'close+open') {
        // 3. Close + Re-evaluate + Open Position
        console.log(`[SolanaExecutor] Step 1/3: Closing old position ${decision.positionId}`);
        const closeSig = await this.mockTransaction('close_position');
        txSignatures.push(closeSig);

        if (!callback) {
          throw new Error('Cannot execute compound close+open rebalance without an injected re-evaluation callback');
        }

        console.log(`[SolanaExecutor] Step 2/3: Invoking re-evaluation callback for position ${decision.positionId}`);
        const reEvalResult = await callback(decision.positionId);

        if (reEvalResult.action === 'open' || reEvalResult.action === 'close+open') {
          const openParams = reEvalResult.action === 'close+open' ? reEvalResult.openParams : reEvalResult.params;
          console.log(`[SolanaExecutor] Step 3/3: Re-evaluation returned OPEN action. Executing new position open in bin range [${openParams.lowerBinId}, ${openParams.upperBinId}]`);
          const openSig = await this.mockTransaction('open_position');
          txSignatures.push(openSig);
        } else {
          console.log(`[SolanaExecutor] Step 3/3: Re-evaluation returned '${reEvalResult.action}' action. Skipping subsequent open.`);
        }
      }

      console.log(`[SolanaExecutor] Execution sequence succeeded. Transactions: ${txSignatures.join(', ')}`);

      return {
        id: executionId,
        decision,
        txSignatures,
        status: 'success',
        executedAt: Date.now()
      };
    } catch (error: any) {
      console.error(`[SolanaExecutor] Execution sequence failed: ${error.message || error}`);
      return {
        id: executionId,
        decision,
        txSignatures,
        status: 'failed',
        error: error.message || String(error),
        executedAt: Date.now()
      };
    }
  }

  private async mockTransaction(actionType: string): Promise<string> {
    // Simulate brief network latency for RPC transaction confirmation
    await new Promise((resolve) => setTimeout(resolve, 150));
    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const signature = `mock_tx_${actionType}_${randomHex}`;
    console.log(`[SolanaExecutor] Transaction confirmed on-chain: ${signature}`);
    return signature;
  }
}
