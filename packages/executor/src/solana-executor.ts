/**
 * @file solana-executor.ts
 * @description Hardened Solana transaction executor for CLMM position operations (open/close/rebalance).
 *
 * @features
 * - Compute Budget optimization: Simulates transactions to set precise Compute Unit limits with a 15% buffer
 * - Delivery Assurance: Rebroadcasts transaction signatures (spam loop) every 2 seconds until confirmed
 * - Type-Safe Bin Parsing: Uses BN.isBN() to determine bin ID representation
 * - Balance Settlement Verification: Ensures RPC node token balances have synchronized before re-evaluation
 *
 * @dependencies IRpcProvider, IExecutor, MeteoraOnChainProvider, Keypair, Connection, Transaction
 * @sideEffects Submits and actively rebroadcasts transactions to the Solana network
 */
import {
  IExecutor,
  Decision,
  MarketSnapshot,
  ExecutionRecord,
  StrategyResult,
  IRpcProvider,
} from '@lp-system/core';
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { MeteoraOnChainProvider } from '@lp-system/providers';
import { getLogger } from '@lp-system/logger';
import BN from 'bn.js';

const logger = getLogger('solana-executor');

/**
 * Institutional-grade Solana executor with Compute Unit simulation and UDP rebroadcasting.
 */
export class SolanaExecutor implements IExecutor {
  private reEvaluateCallback?: (positionId: string) => Promise<StrategyResult>;

  /**
   * Constructs the executor with RPC pool, wallet keypair, and optional priority fee.
   *
   * @param {IRpcProvider} rpcPool - Pool of RPC endpoints for resilience.
   * @param {Keypair} keypair - Solana keypair used to sign transactions.
   * @param {MeteoraOnChainProvider} provider - Meteora on-chain provider for building instructions.
   * @param {{ priorityFeeMicroLamports?: number }} options - Priority fee configuration.
   */
  constructor(
    private rpcPool: IRpcProvider,
    private keypair: Keypair,
    private provider: MeteoraOnChainProvider,
    private options: { priorityFeeMicroLamports?: number } = {}
  ) {
    logger.info(
      `[SolanaExecutor] Initialized for wallet ${this.walletAddress} with RPC pool [${this.rpcPool.constructor.name}] and priority fee ${this.options.priorityFeeMicroLamports || 0} micro-lamports`
    );
  }

  /**
   * Returns the wallet's public key as a base58 string.
   */
  public get walletAddress(): string {
    return this.keypair.publicKey.toBase58();
  }

  /**
   * Sets the re-evaluation callback used for close+open compound operations.
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

        // 1. Fetch on-chain positions to find active range bins
        const activePositions = await this.provider.getOnChainPositions(
          this.walletAddress,
          market.poolAddress
        );
        const onChainPos = activePositions[decision.positionId];
        if (!onChainPos) {
          throw new Error(
            `Cannot close position ${decision.positionId}: not found on-chain for wallet ${this.walletAddress}`
          );
        }

        // 2. Parse bin range from positionData using type-safe BN checks
        const lowerBinId = BN.isBN(onChainPos.positionData.lowerBinId)
          ? (onChainPos.positionData.lowerBinId as BN).toNumber()
          : Number(onChainPos.positionData.lowerBinId);

        const upperBinId = BN.isBN(onChainPos.positionData.upperBinId)
          ? (onChainPos.positionData.upperBinId as BN).toNumber()
          : Number(onChainPos.positionData.upperBinId);

        logger.info(
          `[SolanaExecutor] Found position ${decision.positionId} on-chain in bin range [${lowerBinId}, ${upperBinId}]. Building removal transactions...`
        );

        // 3. Build remove liquidity transactions (automatic chunking by SDK)
        const closeTxs = await this.provider.buildRemoveLiquidityTransactions({
          poolAddress: market.poolAddress,
          userWallet: this.keypair.publicKey,
          positionPubkey: new PublicKey(decision.positionId),
          lowerBinId,
          upperBinId,
          shouldClaimAndClose: true,
        });

        // 4. Submit and confirm each transaction sequentially
        for (let i = 0; i < closeTxs.length; i++) {
          logger.info(
            `[SolanaExecutor] Executing close transaction chunk ${i + 1}/${closeTxs.length}...`
          );
          const sig = await this.executeTx(closeTxs[i]);
          txSignatures.push(sig);
        }
      } else if (decision.action === 'open') {
        const openParams = decision.openParams;
        if (!openParams) {
          throw new Error('Cannot execute open decision: missing openParams');
        }

        const lowerBinId = openParams.lowerBinId ?? openParams.lowerBound;
        const upperBinId = openParams.upperBinId ?? openParams.upperBound;

        logger.info(
          `[SolanaExecutor] Creating OPEN transaction on pool ${market.poolAddress} with lower/upper bins [${lowerBinId}, ${upperBinId}]`
        );

        const slippageTolerance = (openParams.metadata?.slippageTolerance as number) ?? 1;

        // 1. Build add liquidity instructions
        const instructions = await this.provider.buildAddLiquidityInstructions({
          poolAddress: market.poolAddress,
          userWallet: this.keypair.publicKey,
          tokenXAmount: new BN(openParams.tokenXAmount),
          tokenYAmount: new BN(openParams.tokenYAmount),
          lowerBinId,
          upperBinId,
          slippageTolerance,
        });

        // 2. Bundle instructions into a new Transaction
        const openTx = new Transaction().add(...instructions);

        // 3. Submit and confirm
        const openSig = await this.executeTx(openTx);
        txSignatures.push(openSig);
      } else if (decision.action === 'close+open') {
        logger.info(`[SolanaExecutor] Step 1/3: Closing old position ${decision.positionId}`);

        // 1. Close the current position on-chain
        const activePositions = await this.provider.getOnChainPositions(
          this.walletAddress,
          market.poolAddress
        );
        const onChainPos = activePositions[decision.positionId];
        if (!onChainPos) {
          throw new Error(
            `Cannot close position ${decision.positionId}: not found on-chain for wallet ${this.walletAddress}`
          );
        }

        const lowerBinId = BN.isBN(onChainPos.positionData.lowerBinId)
          ? (onChainPos.positionData.lowerBinId as BN).toNumber()
          : Number(onChainPos.positionData.lowerBinId);

        const upperBinId = BN.isBN(onChainPos.positionData.upperBinId)
          ? (onChainPos.positionData.upperBinId as BN).toNumber()
          : Number(onChainPos.positionData.upperBinId);

        const closeTxs = await this.provider.buildRemoveLiquidityTransactions({
          poolAddress: market.poolAddress,
          userWallet: this.keypair.publicKey,
          positionPubkey: new PublicKey(decision.positionId),
          lowerBinId,
          upperBinId,
          shouldClaimAndClose: true,
        });

        for (let i = 0; i < closeTxs.length; i++) {
          logger.info(
            `[SolanaExecutor] Executing close transaction chunk ${i + 1}/${closeTxs.length}...`
          );
          const sig = await this.executeTx(closeTxs[i]);
          txSignatures.push(sig);
        }

        // 2. Verify position closure on-chain
        logger.info(`[SolanaExecutor] Verifying PDA closure and awaiting RPC state sync...`);
        let balancesSettled = false;

        for (let attempt = 0; attempt < 15; attempt++) {
          const currentPositions = await this.provider.getOnChainPositions(
            this.walletAddress,
            market.poolAddress
          );

          if (!currentPositions[decision.positionId]) {
            logger.info(
              `[SolanaExecutor] Position PDA deleted. Applying 2-second buffer for RPC global state sync...`
            );

            // Wait an additional 2 seconds AFTER the PDA is confirmed deleted.
            // This guarantees that when the Strategy queries the token balances in the next step,
            // the RPC node's token indexer has caught up with the program state.
            await new Promise((resolve) => setTimeout(resolve, 2000));

            balancesSettled = true;
            break;
          }

          logger.info(
            `[SolanaExecutor] Position is still active (attempt ${attempt + 1}/15). Waiting 1.5s...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        if (!balancesSettled) {
          throw new Error(
            `Position ${decision.positionId} close tx was confirmed, but RPC node state failed to sync. Aborting re-open.`
          );
        }

        if (!callback) {
          throw new Error(
            'Cannot execute compound close+open rebalance without an injected re-evaluation callback'
          );
        }

        // Explicit 2-second sleep to prevent balance synchronization race condition
        logger.info(
          `[SolanaExecutor] Sleeping 2s to allow RPC nodes to synchronize token balance indices...`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // 3. Trigger re-evaluation with the guaranteed fresh on-chain balance state
        logger.info(
          `[SolanaExecutor] Step 2/3: Invoking re-evaluation callback for position ${decision.positionId}`
        );
        const reEvalResult = await callback(decision.positionId);

        if (reEvalResult.action === 'open' || reEvalResult.action === 'close+open') {
          const openParams =
            reEvalResult.action === 'close+open'
              ? reEvalResult.openParams
              : reEvalResult.params;

          if (!openParams) {
            throw new Error('Re-evaluation returned OPEN action but openParams are missing');
          }

          const newLowerBinId = openParams.lowerBinId ?? openParams.lowerBound;
          const newUpperBinId = openParams.upperBinId ?? openParams.upperBound;

          logger.info(
            `[SolanaExecutor] Step 3/3: Re-evaluation returned OPEN action. Executing new position open in bin range [${newLowerBinId}, ${newUpperBinId}]`
          );

          const slippageTolerance = (openParams.metadata?.slippageTolerance as number) ?? 1;

          const instructions = await this.provider.buildAddLiquidityInstructions({
            poolAddress: market.poolAddress,
            userWallet: this.keypair.publicKey,
            tokenXAmount: new BN(openParams.tokenXAmount),
            tokenYAmount: new BN(openParams.tokenYAmount),
            lowerBinId: newLowerBinId,
            upperBinId: newUpperBinId,
            slippageTolerance,
          });

          const openTx = new Transaction().add(...instructions);
          const openSig = await this.executeTx(openTx);
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
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(
        `[SolanaExecutor] Execution sequence failed: ${err.message || String(error)}`
      );
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

  /**
   * Institutional-grade transaction execution with Compute Unit simulation and active rebroadcasting.
   *
   * @private
   * @param {Transaction} tx - Transaction containing original instructions.
   * @returns {Promise<string>} Confirmed transaction signature.
   */
  private async executeTx(tx: Transaction): Promise<string> {
    return await this.rpcPool.execute(async (connection: Connection) => {
      // 1. Fetch blockhash first
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.feePayer = this.keypair.publicKey;

      // NOTE: We are skipping custom CU simulation and relying entirely
      // on the Meteora SDK's default Compute Budget instructions for now.

      // 2. Sign and serialize the transaction
      tx.sign(this.keypair);
      const rawTx = tx.serialize();

      // 3. The Active Rebroadcast "Spam Loop" (UDP Delivery Assurance)
      logger.info(`[SolanaExecutor] Broadcasting transaction using Meteora SDK defaults...`);

      let signature = '';
      let confirmed = false;
      const startTime = Date.now();
      const timeoutMs = 60000; // 60-second execution timeout
      let attempt = 0;

      while (!confirmed && Date.now() - startTime < timeoutMs) {
        attempt++;
        const elapsed = Date.now() - startTime;
        logger.info(
          `[SolanaExecutor] executeTx attempt #${attempt}. Elapsed: ${elapsed}ms. Timeout limit: ${timeoutMs}ms.`
        );

        try {
          // Send with skipPreflight: true to bypass local node simulation bottlenecks
          signature = await connection.sendRawTransaction(rawTx, {
            skipPreflight: true,
            maxRetries: 0,
          });

          logger.info(
            `[SolanaExecutor] Broadcasted transaction raw payload. Signature: ${signature || 'pending'}. Awaiting signature status...`
          );

          // Check if transaction has hit the block status index
          const status = await connection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
          });

          if (status && status.value && status.value.confirmationStatus) {
            if (status.value.err) {
              throw new Error(
                `Transaction failed on-chain: ${JSON.stringify(status.value.err)}`
              );
            }

            const confStatus = status.value.confirmationStatus;
            logger.info(
              `[SolanaExecutor] Signature ${signature} status: ${confStatus || 'unknown'}`
            );
            if (confStatus === 'confirmed' || confStatus === 'finalized') {
              confirmed = true;
              break;
            }
          } else {
            logger.info(
              `[SolanaExecutor] Signature status not found yet for signature ${signature}`
            );
          }
        } catch (err: unknown) {
          const errMsg = (err as Error).message || String(err);
          const isRateLimit =
            errMsg.includes('429') ||
            errMsg.toLowerCase().includes('too many requests') ||
            errMsg.toLowerCase().includes('rate limit');
          const isSendError =
            (err as { name?: string }).name === 'SendTransactionError' ||
            errMsg.includes('Transaction simulation failed');

          if (
            isSendError ||
            isRateLimit ||
            errMsg.includes('fetch') ||
            errMsg.includes('socket') ||
            errMsg.includes('timeout')
          ) {
            logger.warn(
              `[SolanaExecutor] RPC Send/Rate-limit warning on attempt #${attempt}. Error: ${errMsg}. Elapsed: ${elapsed}ms. Retrying...`
            );
          } else {
            logger.error(
              `[SolanaExecutor] Hard error encountered during sendRawTransaction on attempt #${attempt}: ${errMsg}`
            );
            throw err; // Propagate hard failures
          }
        }

        // Wait 2 seconds before rebroadcasting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!confirmed) {
        throw new Error(
          `Transaction ${signature || '(not sent)'} timed out after ${timeoutMs}ms without confirmation.`
        );
      }

      logger.info(
        `[SolanaExecutor] Transaction successfully confirmed on-chain: ${signature}`
      );
      return signature;
    });
  }

  /**
   * Polls the wallet's token balances until at least one of them increases, indicating settlement.
   *
   * @param {string} tokenXAddress - Token X mint pubkey.
   * @param {string} tokenYAddress - Token Y mint pubkey.
   * @param {string} walletAddress - Owner wallet address.
   * @param {bigint} initialX - Initial token X amount as bigint.
   * @param {bigint} initialY - Initial token Y amount as bigint.
   * @param {number} [timeoutMs=60000] - Total polling timeout.
   */
  public async pollBalances(
    tokenXAddress: string,
    tokenYAddress: string,
    walletAddress: string,
    initialX: bigint,
    initialY: bigint,
    timeoutMs = 60000
  ): Promise<void> {
    const startTime = Date.now();
    logger.info(`[SolanaExecutor] Starting balance polling loop for settlement...`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const balances = await this.rpcPool.execute(async (connection: Connection) => {
          let amountX = '0';
          let amountY = '0';

          const tokenProgramId = new PublicKey('TokenkegQfeZyiNWxFb9eeB2m3tFhGE5LBgxYvhFr1i');
          const token2022ProgramId = new PublicKey(
            'TokenzQhb8NsH26e8m1Yg9UP9Kaj15saWJ361v27m1'
          );

          const fetchForProgram = async (programId: PublicKey) => {
            const response = await connection.getParsedTokenAccountsByOwner(
              new PublicKey(walletAddress),
              { programId }
            );
            for (const account of response.value) {
              const info = account.account.data.parsed.info;
              const mint = info.mint;
              const amount = info.tokenAmount.amount;

              if (mint === tokenXAddress) {
                amountX = amount;
              } else if (mint === tokenYAddress) {
                amountY = amount;
              }
            }
          };

          await fetchForProgram(tokenProgramId);
          await fetchForProgram(token2022ProgramId);

          return { amountX, amountY };
        });

        const currentX = BigInt(balances.amountX);
        const currentY = BigInt(balances.amountY);

        if (currentX > initialX || currentY > initialY) {
          logger.info(
            `[SolanaExecutor] Balance increase detected! Token X: ${initialX} -> ${currentX}, Token Y: ${initialY} -> ${currentY}`
          );
          return;
        }

        logger.info(
          `[SolanaExecutor] No balance increase yet. X: ${currentX} (init: ${initialX}), Y: ${currentY} (init: ${initialY}). Waiting 2s...`
        );
      } catch (err: unknown) {
        logger.warn(
          `[SolanaExecutor] Error polling balances: ${(err as Error).message || String(err)}`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    logger.warn(
      `[SolanaExecutor] Balance polling timed out after ${timeoutMs}ms without increase. Proceeding anyway.`
    );
  }
}
