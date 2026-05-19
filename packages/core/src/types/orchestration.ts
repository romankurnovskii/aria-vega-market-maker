/**
 * @file orchestration.ts
 * @description TypeScript interfaces for the orchestration layer: assignments, decisions, and execution records.
 *
 * @features
 * - Assignment: Strategy-to-position binding with mode and lifecycle metadata
 * - Decision: Action determination (close/open/close+open) with evaluation timestamp
 * - ExecutionRecord: Immutable audit log of decision execution including tx signatures and status
 *
 * @dependencies DecisionAction enum (from enums.ts), OpenParams (from position.ts)
 * @sideEffects None — type definitions only
 */
import { DecisionAction } from './enums';
import { OpenParams } from './position';

export type AssignmentMode = 'active' | 'monitoring';

export interface Assignment {
  id: string;
  strategyId: string; // e.g., 'trailing-usdc'
  positionId: string;
  mode: AssignmentMode;
  createdAt: number;
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
}
