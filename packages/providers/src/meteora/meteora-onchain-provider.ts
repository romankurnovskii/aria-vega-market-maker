/**
 * @file meteora-onchain-provider.ts
 * @description Native on-chain interactions with Meteora DLMM using the official SDK.
 * * @features
 * - Initializes and caches DLMM instances
 * - Fetches precise, real-time on-chain position data (bypassing indexing delays)
 * - Constructs TransactionInstructions for liquidity provision and removal
 * * @dependencies @meteora-ag/dlmm, @solana/web3.js, bn.js
 */
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import DLMM, { StrategyType, LbPosition } from '@meteora-ag/dlmm';
import BN from 'bn.js';
import { IRpcProvider } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('meteora-onchain-provider');

export interface AddLiquidityParams {
  poolAddress: string;
  userWallet: PublicKey;
  tokenXAmount: BN;
  tokenYAmount: BN;
  lowerBinId: number;
  upperBinId: number;
  slippageTolerance: number; // e.g., 1 for 1% (Calculated by the Decision Step)
  positionPubKey: PublicKey; // Position account public key to initialize
}

export interface RemoveLiquidityParams {
  poolAddress: string;
  userWallet: PublicKey;
  positionPubkey: PublicKey;
  lowerBinId: number; // Required for DLMM bin iteration
  upperBinId: number; // Required for DLMM bin iteration
  shouldClaimAndClose: boolean;
}

export interface ClaimFeesParams {
  poolAddress: string;
  userWallet: PublicKey;
  positionPubkey: PublicKey;
}

export interface ClosePositionParams {
  poolAddress: string;
  userWallet: PublicKey;
  positionPubkey: PublicKey;
}

export class MeteoraOnChainProvider {
  private dlmmCache = new Map<string, DLMM>();

  constructor(private rpcProvider: IRpcProvider) {}

  /**
   * Retrieves a cached DLMM instance or initializes a new one.
   */
  public async getDlmmInstance(poolAddress: string): Promise<DLMM> {
    if (this.dlmmCache.has(poolAddress)) {
      return this.dlmmCache.get(poolAddress)!;
    }

    logger.info(`[MeteoraOnChain] Initializing DLMM SDK for pool ${poolAddress}`);

    return await this.rpcProvider.execute(async (connection: Connection) => {
      const dlmm = await DLMM.create(connection, new PublicKey(poolAddress));
      this.dlmmCache.set(poolAddress, dlmm);
      return dlmm;
    });
  }

  /**
   * Fetches the absolute truth of user positions directly from the blockchain.
   * Use this before execution to prevent operating on stale API data.
   */
  public async getOnChainPositions(walletAddress: string, poolAddress: string): Promise<Record<string, LbPosition>> {
    const dlmm = await this.getDlmmInstance(poolAddress);
    const userWallet = new PublicKey(walletAddress);

    return await this.rpcProvider.execute(async () => {
      const { userPositions } = await dlmm.getPositionsByUserAndLbPair(userWallet);

      const positionsMap: Record<string, LbPosition> = {};
      userPositions.forEach((pos) => {
        positionsMap[pos.publicKey.toBase58()] = pos;
      });

      return positionsMap;
    });
  }

  /**
   * Builds the transaction(s) to claim accrued swap fees and liquidity mining rewards.
   * Note: This only builds the transaction. The Executor handles signing and broadcasting.
   */
  public async buildClaimFeesTransactions(params: ClaimFeesParams): Promise<Transaction[]> {
    const dlmm = await this.getDlmmInstance(params.poolAddress);

    logger.info(
      `[MeteoraOnChain] Building ClaimFees Tx for position ${params.positionPubkey.toBase58()} in pool ${params.poolAddress}`
    );

    return await this.rpcProvider.execute(async () => {
      // Fetch the user's fully-parsed position objects from the SDK
      const { userPositions } = await dlmm.getPositionsByUserAndLbPair(params.userWallet);

      // Find the specific position we want to claim from
      const targetPosition = userPositions.find((pos) => pos.publicKey.equals(params.positionPubkey));

      if (!targetPosition) {
        throw new Error(
          `[MeteoraOnChain] Position ${params.positionPubkey.toBase58()} not found for user ${params.userWallet.toBase58()}`
        );
      }

      // Build the claim transaction using the SDK
      const claimTx = await dlmm.claimSwapFee({
        owner: params.userWallet,
        position: targetPosition,
      });

      // The Meteora SDK claim methods typically return a single Transaction,
      // but we normalize it to an array of Transactions to keep the Executor's
      // sequential looping logic uniform across 'close' and 'claim' actions.
      return Array.isArray(claimTx) ? claimTx : [claimTx];
    });
  }

  /**
   * Builds the transaction instructions to open a new position or add liquidity.
   * Uses Spot strategy for uniform distribution across the specified bins.
   */
  public async buildAddLiquidityInstructions(params: AddLiquidityParams): Promise<TransactionInstruction[]> {
    const dlmm = await this.getDlmmInstance(params.poolAddress);

    logger.info(
      `[MeteoraOnChain] Building AddLiquidity Tx: Pool ${params.poolAddress}, Bins [${params.lowerBinId}, ${params.upperBinId}], PositionPubKey: ${params.positionPubKey.toBase58()}`
    );

    return await this.rpcProvider.execute(async () => {
       const addLiquidityTxs = await dlmm.addLiquidity({
        positionPubKey: params.positionPubKey,
        user: params.userWallet,
        totalXAmount: params.tokenXAmount,
        totalYAmount: params.tokenYAmount,
        strategy: {
          maxBinId: params.upperBinId,
          minBinId: params.lowerBinId,
          strategyType: StrategyType.Spot, // TODO good to suport all types once IStrategy suports that
        },
        slippage: params.slippageTolerance,
      });

      // Extract the raw instructions from the Meteora SDK transaction builder
      // This allows the Execution layer to bundle it with compute budget/priority fee instructions
      return addLiquidityTxs.instructions;
    });
  }

  /**
   * Builds the transactions to remove liquidity and claim accrued fees/LM rewards.
   * Note: Returns an array of Transactions (Transaction[]) because closing a wide
   * range of bins can exceed Solana's transaction size limits. The Meteora SDK
   * automatically chunks the instructions into multiple transactions.
   */
  public async buildRemoveLiquidityTransactions(params: RemoveLiquidityParams): Promise<Transaction[]> {
    const dlmm = await this.getDlmmInstance(params.poolAddress);

    logger.info(
      `[MeteoraOnChain] Building RemoveLiquidity Txs for position ${params.positionPubkey.toBase58()} (Bins: ${params.lowerBinId} to ${params.upperBinId})`
    );

    return await this.rpcProvider.execute(async () => {
      const removeLiquidityTxs = await dlmm.removeLiquidity({
        position: params.positionPubkey,
        user: params.userWallet,
        fromBinId: params.lowerBinId,
        toBinId: params.upperBinId,
        bps: new BN(10000), // 100% removal
        shouldClaimAndClose: params.shouldClaimAndClose,
      });

      return removeLiquidityTxs;
    });
  }

  /**
   * Builds the transaction to close an empty position account and reclaim its rent.
   * Note: This MUST be called after all liquidity has been removed and fees claimed.
   */
  public async buildClosePositionTransaction(params: ClosePositionParams): Promise<Transaction[]> {
    const dlmm = await this.getDlmmInstance(params.poolAddress);

    logger.info(
      `[MeteoraOnChain] Building ClosePosition Tx for position ${params.positionPubkey.toBase58()} in pool ${params.poolAddress}`
    );

    return await this.rpcProvider.execute(async () => {
      const { userPositions } = await dlmm.getPositionsByUserAndLbPair(params.userWallet);
      const targetPosition = userPositions.find((pos) => pos.publicKey.equals(params.positionPubkey));

      if (!targetPosition) {
        // If it's already missing, it might have been closed, or it doesn't exist.
        logger.warn(`[MeteoraOnChain] Position ${params.positionPubkey.toBase58()} not found. It may be already closed.`);
        return [];
      }

      const closeTx = await dlmm.closePosition({
        owner: params.userWallet,
        position: targetPosition,
      });

      return Array.isArray(closeTx) ? closeTx : [closeTx];
    });
  }
}
