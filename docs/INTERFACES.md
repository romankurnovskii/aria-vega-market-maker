# Core Interfaces and Type Models

This document lists the formal models and contracts shared across all packages in the monorepo workspace.

## Type Definitions

### TokenAmount

```ts
export interface TokenAmount {
  amount: string; // BigInt or string representation
  decimals: number;
  mint: string;
}
```

### OpenParams

```ts
export interface OpenParams {
  poolAddress: string;
  lowerBinId: number;
  upperBinId: number;
  tokenXAmount: string;
  tokenYAmount: string;
  metadata?: Record<string, unknown>;
}
```

### PricePoint

```ts
export interface PricePoint {
  price: number;
  timestamp: number;
}
```

### Position

```ts
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
```

### MarketSnapshot

```ts
export interface MarketSnapshot {
  poolAddress: string;
  activeBinId: number;
  price: number;
  priceHistory: PricePoint[];
  feeRate: number;
  capturedAt: number;
}
```

### StepContext

```ts
export interface StepContext {
  position: Position;
  market: MarketSnapshot;
  params: Record<string, unknown>; // strategy config
  signal?: 'skip' | 'close' | 'open' | 'close+open';
  openParams?: OpenParams;
  reason?: string;
}
```

### StrategyResult

```ts
export type StrategyResult =
  | { action: 'skip' }
  | { action: 'close' }
  | { action: 'open'; params: OpenParams }
  | { action: 'close+open'; openParams: OpenParams };
```

---

## Core Interfaces

### IStep

```ts
export interface IStep {
  name: string;
  execute(context: StepContext): Promise<StepContext>;
}
```

### IStrategy

```ts
export interface IStrategy {
  id: string;
  execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult>;
}
```

### IOrchestrator

```ts
export interface IOrchestrator {
  id: string;
  assignmentId: string;
  positionId: string;
  strategyId: string;
  mode: 'active' | 'monitoring';
  tick(position: Position, market: MarketSnapshot): Promise<StrategyResult>;
}
```

### IExecutionGate

```ts
export interface IExecutionGate {
  consider(recommendations: Recommendation[], positionId: string): Decision | null;
}
```

### IExecutor

```ts
export interface IExecutor {
  apply(
    decision: Decision,
    market: MarketSnapshot,
    reEvaluate: (positionId: string) => Promise<StrategyResult>
  ): Promise<ExecutionRecord>;
  setReEvaluate(reEvaluate: (positionId: string) => Promise<StrategyResult>): void;
}
```

### IPositionProvider

```ts
export interface IPositionProvider {
  getPositions(walletAddress: string): Promise<Position[]>;
  getPosition(positionId: string): Promise<Position>;
  getPoolInfo(poolAddress: string): Promise<PoolInfo>;
  getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot>;
}
```
