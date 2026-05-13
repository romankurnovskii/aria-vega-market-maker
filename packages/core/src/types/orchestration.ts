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
}

export type RebalanceTaskStatus = 'pending_close' | 'awaiting_settlement' | 'pending_open';

export type TaskEventStage =
  // 1. Universal Start
  | 'INIT'

  // 2. The Close Leg (Used by 'close' and 'close+open')
  | 'CLOSE_BROADCAST'
  | 'CLOSE_CONFIRMED'

  // 3. The Settlement Buffer (Used by 'close+open')
  | 'SETTLEMENT_POLLING'
  | 'SETTLEMENT_DETECTED'

  // 4. The Strategy Check (Used by 'close+open')
  | 'JIT_REEVALUATION'
  | 'JIT_SKIPPED' // NEW: Used if JIT evaluation says "market is too volatile, do not open"

  // 5. The Open Leg (Used by 'open' and 'close+open')
  | 'OPEN_BROADCAST'
  | 'OPEN_CONFIRMED' // NEW: Added for symmetry with close

  // 6. Terminal States (Universal End)
  | 'COMPLETED'
  | 'ERROR'
  | 'TIMEOUT'; // NEW: Used if the Execution Monitor catches a dead task

export interface TaskEvent {
  stage: TaskEventStage;
  timestamp: number;
  message?: string;
  txSignature?: string;
  error?: string;
}

export interface RebalanceTask {
  id: string;
  assignmentId: string;
  status: RebalanceTaskStatus;
  originalPositionId: string;
  newPositionId?: string;
  intent: Decision;
  evaluatedAt: number;
  expectedDeltaX?: string;
  expectedDeltaY?: string;
  events: TaskEvent[];
}
