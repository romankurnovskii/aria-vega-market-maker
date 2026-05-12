/**
 * @file interfaces.ts
 * @description Core interface definitions for domain services, strategies, and orchestration components.
 *
 * @features
 * - IStep: Executable pipeline step with context transformation
 * - IStrategy: Strategy interface for trading decisions (execute → StrategyResult)
 * - IOrchestrator: Per-position orchestrator managing strategy lifecycle
 * - IExecutionGate: Decision filtering and prioritization gate
 * - IExecutor: Transaction execution handler for on-chain operations
 * - IPositionProvider: External data source abstraction for positions/markets
 * - IRpcProvider: RPC connection abstraction with retry logic
 * - IStore / IPositionStore: Persistence layer interfaces
 * - IOrchestratorRegistry: In-memory orchestrator lifecycle manager
 *
 * @dependencies None — defines contract types only
 * @sideEffects None
 */
import {
  Position,
  MarketSnapshot,
  PoolInfo,
  Recommendation,
  Decision,
  ExecutionRecord,
  StrategyResult,
  Assignment,
  AssignmentMode,
  StepContext,
  RebalanceTask,
} from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConnectionPlaceholder = any;

export interface IStep {
  name: string;
  execute(context: StepContext): Promise<StepContext>;
}

export interface IStrategy {
  id: string;
  description: string;
  execute(position: Position, market: MarketSnapshot, params: Record<string, unknown>): Promise<StrategyResult>;
}

export interface IOrchestrator {
  id: string;
  assignmentId: string;
  positionId: string;
  strategyId: string;
  mode: AssignmentMode;
  isExecuting: boolean;
  tick(position: Position, market: MarketSnapshot): Promise<StrategyResult>;
}

export interface IExecutionGate {
  consider(recommendations: Recommendation[], positionId: string): Decision | null;
}

export interface IExecutor {
  apply(
    decision: Decision,
    market: MarketSnapshot,
    reEvaluate: (positionId: string) => Promise<StrategyResult>
  ): Promise<ExecutionRecord>;
  setReEvaluate(reEvaluate: (positionId: string) => Promise<StrategyResult>): void;
}

export interface IPositionProvider {
  getPositions(walletAddress: string, poolAddress?: string): Promise<Position[]>;
  getPosition(positionId: string, poolAddress?: string): Promise<Position>;
  getPoolInfo(poolAddress: string): Promise<PoolInfo>;
  getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot>;
}

export interface IRpcProvider {
  getConnection(): ConnectionPlaceholder;
  execute<T>(fn: (conn: ConnectionPlaceholder) => Promise<T>): Promise<T>;
}

export interface IStore {
  getAssignments(): Promise<Assignment[]>;
  saveAssignment(assignment: Assignment): Promise<void>;
  deleteAssignment(id: string): Promise<void>;
  getExecutionRecords(): Promise<ExecutionRecord[]>;
  saveExecutionRecord(record: ExecutionRecord): Promise<void>;
  getTasks(): Promise<RebalanceTask[]>;
  saveTask(task: RebalanceTask): Promise<void>;
  deleteTask(id: string): Promise<void>;
}

export interface IPositionStore {
  getKnown(): Promise<Position[]>;
  saveKnown(positions: Position[]): Promise<void>;
  archivePosition(position: Position): Promise<void>;
  getArchived(): Promise<Position[]>;
}

export interface IOrchestratorRegistry {
  register(orchestrator: IOrchestrator): void;
  deregister(id: string): void;
  deregisterByAssignmentId(assignmentId: string): void;
  getForPosition(positionId: string): IOrchestrator[];
  get(id: string): IOrchestrator | undefined;
  getAll(): IOrchestrator[];
}
