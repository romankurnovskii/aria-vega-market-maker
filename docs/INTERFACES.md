# Core Interfaces and Type Models

This document lists the formal models and contracts shared across all packages in the monorepo workspace.

---

## 1. Type Definitions

All types are defined in `packages/core/src/types/`:

| Type                  | Source File                                                             | Description                                                                                  |
| :-------------------- | :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| `TokenAmount`         | [`types/token.ts`](../packages/core/src/types/token.ts)                 | Representation of a token amount with decimals and address.                                  |
| `OpenParams`          | [`types/position.ts`](../packages/core/src/types/position.ts)           | Parameters needed to open a CLMM position (bounds, amounts).                                 |
| `Position`            | [`types/position.ts`](../packages/core/src/types/position.ts)           | Complete on-chain position state.                                                            |
| `PricePoint`          | [`types/market.ts`](../packages/core/src/types/market.ts)               | Timestamped on-chain price data point.                                                       |
| `MarketSnapshot`      | [`types/market.ts`](../packages/core/src/types/market.ts)               | Complete snapshot of pool state and history.                                                 |
| `PoolInfo`            | [`types/market.ts`](../packages/core/src/types/market.ts)               | Immutable pool configuration metadata.                                                       |
| `StepContext`         | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           | Context pipeline shared across execution steps.                                              |
| `StrategyResult`      | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           | Output recommendation of a strategy execution.                                               |
| `Recommendation`      | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           | Recommendation bound to a specific assignment.                                               |
| `LPEvent`             | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           | Representation of liquidity events.                                                          |
| `Assignment`          | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) | Config binding between a strategy and position.                                              |
| `Decision`            | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) | Gated decision dispatched for execution.                                                     |
| `ExecutionRecord`     | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) | On-chain execution outcome and signatures log.                                               |
| `RebalanceTask`       | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) | Persistent write-ahead rebalance task tracker.                                               |
| `RebalanceTaskStatus` | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) | Union type for rebalance phases: `pending_close` \| `awaiting_settlement` \| `pending_open`. |

### `RebalanceTask` Schema Contract

```typescript
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
  | 'JIT_SKIPPED' // Used if JIT evaluation says "market is too volatile, do not open"

  // 5. The Open Leg (Used by 'open' and 'close+open')
  | 'OPEN_BROADCAST'
  | 'OPEN_CONFIRMED' // Added for symmetry with close

  // 6. Terminal States (Universal End)
  | 'COMPLETED'
  | 'ERROR'
  | 'TIMEOUT'; // Used if the Execution Monitor catches a dead task

export interface TaskEvent {
  stage: TaskEventStage;
  timestamp: number;
  message?: string;
  txSignature?: string;
  error?: string;
}

export interface RebalanceTask {
  id: string; // Unique task UUID
  assignmentId: string; // Link to active strategy assignment
  status: RebalanceTaskStatus; // Current rebalance phase
  originalPositionId: string; // Position ID of the closed position (PDA deleted on-chain)
  newPositionId?: string; // Position ID of the newly opened position. Null until the
  // open transaction confirms. Set by the executor on success.
  // Used by the discovery loop on recovery to register the new
  // orchestrator without waiting for the next chain poll.
  intent: Decision; // Gated decision being executed, including range and metadata
  evaluatedAt: number; // Epoch ms timestamp of strategy evaluation. Used by the
  // JIT staleness check: if Date.now() - evaluatedAt > MAX_SIGNAL_AGE_MS
  // the signal is stale and the task re-enters awaiting_settlement.
  events: TaskEvent[]; // List of events logged during task processing
}
```

**Field notes:**

`newPositionId` is `undefined` through the `pending_close` and `awaiting_settlement` phases. The executor sets it immediately after the open transaction confirms, before calling `deleteTask`. On crash recovery during `awaiting_settlement`, it will always be `undefined` — which is the correct signal that the open leg has not yet run.

`evaluatedAt` records when the strategy produced the `Decision` stored in `intent`, not when the task was created. These can differ if the task was created with a slightly delayed write. The JIT check compares this timestamp against the moment the executor is about to sign the open transaction.

---

## 2. Core Interfaces

All interfaces are defined in `packages/core/src/interfaces.ts`:

| Interface               | Description                                                               | Key methods / properties                                                                                                                                   |
| :---------------------- | :------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IStep`                 | Pipeline step with context transformation                                 | `execute(context): Promise<StepContext>`                                                                                                                   |
| `IStrategy`             | Evaluates trading rules against a position                                | `execute(position, market, params): Promise<StrategyResult>`                                                                                               |
| `IOrchestrator`         | Per-position strategy runtime manager                                     | `tick(position, market): Promise<StrategyResult>`, `isExecuting: boolean`                                                                                  |
| `IExecutionGate`        | Filters and prioritizes recommendations into decisions                    | `consider(recommendations, positionId): Decision \| null`                                                                                                  |
| `IExecutor`             | Handles stateful on-chain transaction execution                           | `apply(decision, market, reEvaluate): Promise<ExecutionRecord>`                                                                                            |
| `IPositionProvider`     | Queries live positions and market snapshots                               | `getPositions()`, `getPosition()`, `getPoolInfo()`, `getMarketSnapshot()`                                                                                  |
| `IRpcProvider`          | Abstracts Solana Connection with retry and rate-limit handling            | `getConnection()`, `execute(fn)`                                                                                                                           |
| `IStore`                | Persistence layer for assignments, execution records, and rebalance tasks | `getAssignments()`, `saveAssignment()`, `deleteAssignment()`, `getExecutionRecords()`, `saveExecutionRecord()`, `getTasks()`, `saveTask()`, `deleteTask()` |
| `IPositionStore`        | Local cache of known on-chain positions for discovery diffing             | `getKnown()`, `saveKnown(positions)`                                                                                                                       |
| `IOrchestratorRegistry` | In-memory runtime index of active orchestrators                           | `register(orch)`, `deregister(id)`, `getForPosition(posId)`, `getAll()`                                                                                    |

See [`interfaces.ts`](../packages/core/src/interfaces.ts) for full interface declarations.
