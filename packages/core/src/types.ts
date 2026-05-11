export interface TokenAmount {
  amount: string;
  decimals: number;
  mint: string;
}

export interface OpenParams {
  poolAddress: string;
  lowerBinId: number;
  upperBinId: number;
  tokenXAmount: string;
  tokenYAmount: string;
  metadata?: Record<string, unknown>;
}

export interface PricePoint {
  price: number;
  timestamp: number;
}

export interface Position {
  id: string; // on-chain pubkey
  poolAddress: string;
  lowerBinId: number;
  upperBinId: number;
  tokenX: TokenAmount;
  tokenY: TokenAmount;
  isInRange: boolean;
  openedAt: number; // timestamp
  metadata: Record<string, unknown>;
}

export interface MarketSnapshot {
  poolAddress: string;
  activeBinId: number;
  price: number;
  priceHistory: PricePoint[]; // last N minutes
  feeRate: number;
  capturedAt: number;
}

export interface StepContext {
  position: Position;
  market: MarketSnapshot;
  params: Record<string, unknown>; // strategy config
  signal?: 'skip' | 'close' | 'open' | 'close+open';
  openParams?: OpenParams;
  reason?: string;
}

export type StrategyResult =
  | { action: 'skip' }
  | { action: 'close' }
  | { action: 'open'; params: OpenParams }
  | { action: 'close+open'; openParams: OpenParams };

export interface Assignment {
  id: string;
  strategyId: string; // e.g., 'trailing-usdc'
  positionId: string;
  mode: 'active' | 'monitoring';
  createdAt: number;
}

export interface Decision {
  positionId: string;
  action: 'close' | 'open' | 'close+open';
  openParams?: OpenParams;
  sourceAssignmentId: string;
  evaluatedAt: number;
}

export interface ExecutionRecord {
  id: string;
  decision: Decision;
  txSignatures: string[];
  status: 'success' | 'failed';
  error?: string;
  executedAt: number;
}

export interface LPEvent {
  id: string;
  type: 'position_opened' | 'position_closed' | 'rebalance_triggered' | 'error';
  timestamp: number;
  data: Record<string, unknown>;
}

export interface PoolInfo {
  poolAddress: string;
  binStep: number;
  feeRate: number;
  activeBinId: number;
  tokenXMint: string;
  tokenYMint: string;
}

export interface Recommendation {
  assignmentId: string;
  result: StrategyResult;
}
