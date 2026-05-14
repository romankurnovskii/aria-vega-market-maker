/**
 * @file types.ts
 * @description TypeScript types for Meteora DLMM REST API responses.
 *
 * @features
 * - PoolResponse: Full pool metadata and current state (GET /pools/{address})
 * - ErrorResponse: API error response (400)
 * - CumulativeMetrics: Aggregate volume and total fees
 * - TimeWindowData: Time-windowed metrics (30m / 1h / 2h / 4h / 12h / 24h)
 * - PoolConfig: Pool configuration (bin step, fee rates)
 * - TokenMetrics: Token metadata (price, supply, holders, etc.)
 *
 * @dependencies None — standalone API response types
 * @sideEffects None — type definitions only
 */

// ---------------------------------------------------------------------------
// Top-level response types
// ---------------------------------------------------------------------------

export interface PoolResponse {
  address: string; // Base58-encoded pool address
  apr: number; // 24 hour APR
  apy: number; // 24 hour APY
  created_at: number; // Pool created at timestamp (int64)
  cumulative_metrics: CumulativeMetrics;
  current_price: number; // Price of the liquidity pair
  dynamic_fee_pct: number; // Dynamic fee rate — base fee + variable fee
  farm_apr: number; // Farm reward APR
  farm_apy: number; // Farm reward APY
  fee_tvl_ratio: TimeWindowData;
  fees: TimeWindowData;
  has_farm: boolean;
  is_blacklisted: boolean;
  name: string;
  pool_config: PoolConfig;
  protocol_fees: TimeWindowData;
  reserve_x: string;
  reserve_y: string;
  reward_mint_x: string;
  reward_mint_y: string;
  tags: string[];
  token_x: TokenMetrics;
  token_x_amount: number;
  token_y: TokenMetrics;
  token_y_amount: number;
  /**
   * Total Value Locked — total liquidity the liquidity pair holds.
   */
  tvl: number;
  volume: TimeWindowData;
  launchpad: string;
}

export interface ErrorResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// Component schemas
// ---------------------------------------------------------------------------

export interface CumulativeMetrics {
  volume: number;
  fees: number;
}

export interface TimeWindowData {
  '30m': number;
  '1h': number;
  '2h': number;
  '4h': number;
  '12h': number;
  '24h': number;
}

export interface PoolConfig {
  base_fee_pct: number;
  bin_step: number;
  max_fee_pct: number;
  protocol_fee_pct: number;
  collect_fee_mode: number;
}

export interface TokenMetrics {
  address: string;
  decimals: number;
  freeze_authority_disabled: boolean;
  holders: number;
  is_verified: boolean;
  market_cap: number;
  name: string;
  price: number;
  symbol: string;
  total_supply: number;
}

// ---------------------------------------------------------------------------
// OHLCV Timeseries response types
// ---------------------------------------------------------------------------

export interface OhlcvCandle {
  timestamp: number; // Unix timestamp in seconds
  timestamp_str: string; // ISO-8601 string representation
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OhlcvResponse {
  start_time: number;
  end_time: number;
  timeframe: string | null;
  data: OhlcvCandle[];
}

// ---------------------------------------------------------------------------
// Position and PnL response types
// ---------------------------------------------------------------------------

export interface DatapiPosition {
  address: string;
  pool_address: string;
  lower_bin_id: number;
  upper_bin_id: number;
  amount_x: string;
  amount_y: string;
  is_in_range: boolean;
  opened_at: number;
  fee_x?: string;
  fee_y?: string;
  pnl_x?: string;
  pnl_y?: string;
  lowerBinId?: number;
  upperBinId?: number;
  amountX?: string;
  amountY?: string;
  isInRange?: boolean;
  positionAddress?: string;
  position_address?: string;
  isOutOfRange?: boolean;
  createdAt?: number;
  pool_data?: PoolResponse;
  minPrice?: string;
  maxPrice?: string;
  poolActiveBinId?: number;
  poolActivePrice?: string;
  feePerTvl24h?: string;
  isClosed?: boolean;
  closedAt?: number | null;
  pnlUsd?: string;
  pnlSol?: string;
  pnlPctChange?: string;
  pnlSolPctChange?: string;
  allTimeDeposits?: {
    tokenX?: { amount?: string; usd?: string; amountSol?: string };
    tokenY?: { amount?: string; usd?: string; amountSol?: string };
    total?: { usd?: string; sol?: string };
  };
  allTimeWithdrawals?: {
    tokenX?: { amount?: string; usd?: string; amountSol?: string };
    tokenY?: { amount?: string; usd?: string; amountSol?: string };
    total?: { usd?: string; sol?: string };
  };
  allTimeFees?: {
    tokenX?: { amount?: string; usd?: string; amountSol?: string };
    tokenY?: { amount?: string; usd?: string; amountSol?: string };
    total?: { usd?: string; sol?: string };
  };
  unrealizedPnl?: {
    balances?: number;
    balancesSol?: string;
    balanceTokenX?: { amount?: string; usd?: string; amountSol?: string };
    balanceTokenY?: { amount?: string; usd?: string; amountSol?: string };
    unclaimedFeeTokenX?: { amount?: string; usd?: string; amountSol?: string };
    unclaimedFeeTokenY?: { amount?: string; usd?: string; amountSol?: string };
    unclaimedRewardTokenX?: { amount?: string; usd?: string; amountSol?: string };
    unclaimedRewardTokenY?: { amount?: string; usd?: string; amountSol?: string };
  };
}

export interface PositionsPnlResponse {
  tokenX: string;
  tokenY: string;
  totalCount: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  positions: DatapiPosition[];
  tokenXPrice: string;
  tokenYPrice: string;
  rewardTokenX: string;
  rewardTokenY: string;
  rewardTokenXPrice: string;
  rewardTokenYPrice: string;
  solPrice: string;
}
