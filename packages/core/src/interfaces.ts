import {
  Position,
  MarketSnapshot,
  PoolInfo,
  Recommendation,
  Decision,
  ExecutionRecord,
  StrategyResult,
  Assignment,
  StepContext
} from './types';

export type ConnectionPlaceholder = any;

export interface IStep {
  name: string;
  execute(context: StepContext): Promise<StepContext>;
}

export interface IStrategy {
  id: string;
  execute(position: Position, market: MarketSnapshot, params: Record<string, unknown>): Promise<StrategyResult>;
}

export interface IOrchestrator {
  id: string;
  assignmentId: string;
  positionId: string;
  strategyId: string;
  mode: 'active' | 'monitoring';
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
  getPositions(walletAddress: string): Promise<Position[]>;
  getPosition(positionId: string): Promise<Position>;
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
}

export interface IPositionStore {
  getKnown(): Promise<Position[]>;
  saveKnown(positions: Position[]): Promise<void>;
}

export interface IOrchestratorRegistry {
  register(orchestrator: IOrchestrator): void;
  deregister(id: string): void;
  getForPosition(positionId: string): IOrchestrator[];
  get(id: string): IOrchestrator | undefined;
  getAll(): IOrchestrator[];
}
