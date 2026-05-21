/**
 * @file api.ts
 * @description Shared TypeScript interfaces for the Aria Vega API domain — data models
 *              for positions, wallets, assignments, strategies, steps, lineage, and eval logs.
 *
 * @features
 * - AriaVegaData — top-level aggregation of all dashboard data
 * - Position, Wallet, Assignment, Strategy, Step — core entity interfaces
 * - RawApiPosition — raw API response shape for positions (snake_case fields)
 * - EvalLogEntry — event log entry for strategy evaluation results
 * - PositionLineageRecord — closed-to-new position chain tracking
 */

export interface HealthData {
  epoch: number;
  status: string;
}

export interface Wallet {
  chain: string;
  address: string;
  is_default: boolean;
  portfolio?: Record<string, unknown>;
}

export interface Position {
  id: string;
  pool: string;
  minBin: number;
  maxBin: number;
  binCount: number;
  rangePercent: number;
  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  activeBin?: number;
  status: string;
  state: string;
  tokenX: { amount: string; decimals: number; mint?: string; tokenAddress?: string } | null | undefined;
  tokenY: { amount: string; decimals: number; mint?: string; tokenAddress?: string } | null | undefined;
  openedAt?: number;
  poolActivePrice?: number;
  raw: Record<string, unknown>;
  pnlData?: Record<string, unknown>;
  _wallet?: string;
}

export interface Assignment {
  id: string;
  positionId: string;
  strategyId: string;
  mode: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  risk: string;
}

export interface Step {
  id: string;
  type: string;
  description: string;
}

export interface PositionLineageRecord {
  closedPositionId: string;
  newPositionId: string;
  poolAddress: string;
  strategyId: string;
  closedAt: number;
  openedAt: number;
  oldAssignmentId: string;
  newAssignmentId: string;
  closeTxSignature: string;
  openTxSignature: string;
}

export interface AriaVegaData {
  health: HealthData;
  positions: Position[];
  assignments: Assignment[];
  strategies: Strategy[];
  steps: Step[];
  wallets: Wallet[];
  lineage: PositionLineageRecord[];
}

export interface RawApiPosition {
  id: string;
  poolAddress: string;
  lowerBinId?: number;
  upperBinId?: number;
  lowerBound?: number;
  upperBound?: number;
  binCount?: number;
  rangePercent?: number;
  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  activeBin?: number;
  openedAt?: number;
  poolActivePrice?: number;
  isInRange?: boolean;
  state?: string;
  tokenX?: { amount: string; decimals: number; mint?: string; tokenAddress?: string };
  tokenY?: { amount: string; decimals: number; mint?: string; tokenAddress?: string };
  pnlData?: Record<string, unknown>;
  metadata?: { pnl?: Record<string, unknown> };
  binStep?: number;
  baseFee?: number;
  feeRate?: number;
  [key: string]: unknown;
}

export interface EvalLogEntry {
  id: number;
  timestamp: string;
  action: string;
  strategyId?: string;
  positionId?: string;
  result?: unknown;
  error?: string;
  transactionSignatures?: string[];
  pendingSuggestion?: { action: string; openParams?: Record<string, unknown> };
}
