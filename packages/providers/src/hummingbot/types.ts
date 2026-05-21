/**
 * @file types.ts
 * @description TypeScript interfaces for the Hummingbot Gateway CLMM API — pool bins,
 *              position data, wallet info, OHLCV, and open/close response types.
 *
 * @features
 * - CLMMPoolBin — individual bin within a concentrated liquidity pool
 * - CLMMPosition — full position data from the Gateway API
 * - GatewayWallet — wallet info returned from the Gateway
 * - CLMMClosePositionResponse — response shape from close-position endpoint
 * - OhlcvResponse — OHLCV data point for price analytics
 *
 * @dependencies None — pure type definitions
 */

export interface CLMMPoolBin {
  binId: number;
  price: string;
  baseTokenAmount: string;
  quoteTokenAmount: string;
}

export interface CLMMPoolInfoResponse {
  address: string;
  baseTokenAddress: string;
  quoteTokenAddress: string;
  binStep: number | null;
  feePct: string;
  price: string;
  baseTokenAmount: string;
  quoteTokenAmount: string;
  activeBinId: number | null;
  dynamicFeePct: string | null;
  minBinId: number | null;
  maxBinId: number | null;
  bins: CLMMPoolBin[];
}

export interface CLMMOpenPositionRequest {
  connector: string;
  network: string;
  pool_address: string;
  lower_price: number | string;
  upper_price: number | string;
  base_token_amount?: number | string | null;
  quote_token_amount?: number | string | null;
  slippage_pct?: number | string | null;
  wallet_address?: string | null;
  extra_params?: Record<string, unknown> | null;
}

export interface CLMMOpenPositionResponse {
  transaction_hash: string;
  position_address: string;
  trading_pair: string;
  pool_address: string;
  lower_price: string;
  upper_price: string;
  status: string;
}

export interface CLMMClosePositionRequest {
  connector: string;
  network: string;
  position_address: string;
  wallet_address?: string | null;
}

export interface CLMMClosePositionResponse {
  transaction_hash: string;
  position_address: string;
  base_fee_collected: string;
  quote_fee_collected: string;
  status: string;
}

export interface CLMMPositionsOwnedRequest {
  connector: string;
  network: string;
  pool_address: string;
  wallet_address?: string | null;
}

export interface CLMMPositionInfo {
  position_address: string;
  pool_address: string;
  trading_pair: string;
  base_token: string;
  quote_token: string;
  base_token_amount: string;
  quote_token_amount: string;
  current_price: string;
  lower_price: string;
  upper_price: string;
  base_fee_amount: string | null;
  quote_fee_amount: string | null;
  lower_bin_id: number | null;
  upper_bin_id: number | null;
  in_range: boolean;
}

export interface CLMMPoolListItem {
  address: string;
  name: string;
  trading_pair: string;
  mint_x: string;
  mint_y: string;
  bin_step: number;
  current_price: string;
  liquidity: string;
  base_fee_percentage: string | null;
  apr: string | null;
  apy: string | null;
  volume_24h: string | null;
  fees_24h: string | null;
}

export interface CLMMPoolListResponse {
  pools: CLMMPoolListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GatewayWallet {
  chain: string;
  address: string;
  is_default: boolean;
  balances?: Record<string, string>;
}

export interface CandlesConfigRequest {
  connector_name: string;
  trading_pair: string;
  interval?: string;
  max_records?: number;
}

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandlesResponse {
  connector_name: string;
  trading_pair: string;
  interval: string;
  candles: CandleData[];
}

export interface HistoricalCandlesConfig {
  connector_name: string;
  trading_pair: string;
  interval: string;
  start_time: number;
  end_time: number;
}

export interface RateOracleSourceConfig {
  name?: string;
}

export interface GlobalTokenConfig {
  symbol?: string;
  address?: string;
}

export interface RateOracleConfig {
  rate_oracle_source: RateOracleSourceConfig;
  global_token: GlobalTokenConfig;
}

export interface RateOracleConfigResponse {
  rate_oracle_source: RateOracleSourceConfig;
  global_token: GlobalTokenConfig;
  available_sources: string[];
}

export interface RateRequest {
  trading_pairs: string[];
}

export interface RateResponse {
  source: string;
  quote_token: string;
  rates: Record<string, number | null>;
}

export interface SingleRateResponse {
  trading_pair: string;
  rate: number | null;
  source: string;
  quote_token: string;
}

export interface CreateWalletRequest {
  chain: string;
  set_default?: boolean;
}

export interface GatewayWalletCredential {
  chain: string;
  private_key: string;
  set_default?: boolean;
}

export interface SetDefaultWalletRequest {
  chain: string;
  address: string;
}
