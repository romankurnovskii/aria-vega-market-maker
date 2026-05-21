/**
 * @file orchestration.ts
 * @description TypeScript interfaces for the orchestration layer: assignments, decisions, execution records, and position lineage tracking.
 *
 * @features
 * - Assignment: Strategy-to-position binding with mode and lifecycle metadata
 * - Decision: Action determination (close/open/close+open) with evaluation timestamp
 * - ExecutionRecord: Immutable audit log of decision execution including tx signatures and status
 * - PositionLineageRecord: Track lineage of closed and newly opened rebalanced positions
 *
 * @dependencies DecisionAction enum (from enums.ts), OpenParams (from position.ts)
 * @sideEffects None — type definitions only
 */
import { DecisionAction } from './enums';
import { OpenParams, Position } from './position';

export type AssignmentMode = 'active' | 'pending_open';

export interface Assignment {
  id: string;
  strategyId: string; // e.g., 'trailing-usdc'
  positionId: string;
  mode: AssignmentMode;
  createdAt: number;
  recoveryData?: {
    poolAddress: string;
    oldPosition: Position;
    closeTxSignature: string;
  };
}

export interface Decision {
  positionId: string;
  action: DecisionAction | 'close' | 'open' | 'close+open'; // Accept both enums and literal values
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
  newPositionId?: string;
  recordVersion?: number;
  metrics?: {
    baseFeeCollected?: string;
    quoteFeeCollected?: string;
    [key: string]: unknown;
  };
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
