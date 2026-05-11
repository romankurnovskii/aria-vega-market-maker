/**
 * @file market.ts
 * @description Market data types: snapshots, price history, and pool metadata.
 *
 * @features
 * - PricePoint: Single timestamped price
 * - MarketSnapshot: Complete view of pool state (price, active bound, fee, history)
 * - PoolInfo: Immutable pool configuration (addresses, chain, protocol, fee rate)
 * - Agnostic boundary design: `activeBound`, `lowerBound`, `upperBound` abstract away Solana bins vs EVM ticks
 *
 * @dependencies ChainId, ProtocolType (from chain.ts)
 * @sideEffects None — type definitions only
 */
import { ChainId, ProtocolType } from './chain';

export interface PricePoint {
  price: number;
  timestamp: number;
}

export interface MarketSnapshot {
  poolAddress: string;
  chain: ChainId;
  protocol: ProtocolType;
  activeBound: number; // Agnostic active boundary (activeBinId or activeTick)
  price: number;
  priceHistory: PricePoint[]; // last N minutes
  feeRate: number;
  capturedAt: number;

  /**
   * @deprecated Use `activeBound` instead. Kept for legacy Solana/Meteora support.
   */
  activeBinId?: number;
}

export interface PoolInfo {
  poolAddress: string;
  chain: ChainId;
  protocol: ProtocolType;
  feeRate: number;
  activeBound: number; // Agnostic boundary
  tokenXAddress: string; // Agnostic
  tokenYAddress: string; // Agnostic

  /**
   * @deprecated Kept for legacy Solana/Meteora support.
   */
  binStep?: number;
  /**
   * @deprecated Use `activeBound` instead. Kept for legacy Solana/Meteora support.
   */
  activeBinId?: number;
  /**
   * @deprecated Use `tokenXAddress` instead. Kept for legacy Solana/Meteora support.
   */
  tokenXMint?: string;
  /**
   * @deprecated Use `tokenYAddress` instead. Kept for legacy Solana/Meteora support.
   */
  tokenYMint?: string;
}
