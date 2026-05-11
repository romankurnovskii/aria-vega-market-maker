/**
 * @file position.ts
 * @description Position and order parameter types for CLMM LP positions.
 *
 * @features
 * - OpenParams: Parameters required to open a new position (range, amounts, pool)
 * - Position: Full on-chain position state including bounds, tokens, and metadata
 * - TokenAmount: Standardized token amount with decimals and address
 * - Agnostic boundary design: `lowerBound`/`upperBound` abstract away Solana bins vs EVM ticks
 *
 * @dependencies ChainId, ProtocolType (from chain.ts), TokenAmount (internal)
 * @sideEffects None — type definitions only
 */
import { ChainId, ProtocolType } from './chain';
import { TokenAmount } from './token';

export interface OpenParams {
  poolAddress: string;
  lowerBound: number; // Agnostic boundary (lowerBinId or lowerTick)
  upperBound: number; // Agnostic boundary (upperBinId or upperTick)
  tokenXAmount: string;
  tokenYAmount: string;
  metadata?: Record<string, unknown>;

  /**
   * @deprecated Use `lowerBound` instead. Kept for legacy Solana/Meteora support.
   */
  lowerBinId?: number;
  /**
   * @deprecated Use `upperBound` instead. Kept for legacy Solana/Meteora support.
   */
  upperBinId?: number;
}

export interface Position {
  id: string; // on-chain identifier (pubkey on Solana, NFT id on EVM)
  poolAddress: string;
  chain: ChainId;
  protocol: ProtocolType;
  lowerBound: number; // Agnostic boundary (lowerBinId or lowerTick)
  upperBound: number; // Agnostic boundary (upperBinId or upperTick)
  tokenX: TokenAmount;
  tokenY: TokenAmount;
  isInRange: boolean;
  openedAt: number; // timestamp
  metadata: Record<string, unknown>;

  /**
   * @deprecated Use `lowerBound` instead. Kept for legacy Solana/Meteora support.
   */
  lowerBinId?: number;
  /**
   * @deprecated Use `upperBound` instead. Kept for legacy Solana/Meteora support.
   */
  upperBinId?: number;
}
