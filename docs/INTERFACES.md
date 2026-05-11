# Core Interfaces and Type Models

This document lists the formal models and contracts shared across all packages in the monorepo workspace.

## Type Definitions

All types are defined in `packages/core/src/types/`:

| Type              | Source File                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| `TokenAmount`     | [`types/token.ts`](../packages/core/src/types/token.ts)                 |
| `OpenParams`      | [`types/position.ts`](../packages/core/src/types/position.ts)           |
| `Position`        | [`types/position.ts`](../packages/core/src/types/position.ts)           |
| `PricePoint`      | [`types/market.ts`](../packages/core/src/types/market.ts)               |
| `MarketSnapshot`  | [`types/market.ts`](../packages/core/src/types/market.ts)               |
| `PoolInfo`        | [`types/market.ts`](../packages/core/src/types/market.ts)               |
| `StepContext`     | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           |
| `StrategyResult`  | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           |
| `Recommendation`  | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           |
| `LPEvent`         | [`types/strategy.ts`](../packages/core/src/types/strategy.ts)           |
| `Assignment`      | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) |
| `Decision`        | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) |
| `ExecutionRecord` | [`types/orchestration.ts`](../packages/core/src/types/orchestration.ts) |

## Core Interfaces

All interfaces are defined in `packages/core/src/interfaces.ts`:

| Interface               | Description                                                         |
| ----------------------- | ------------------------------------------------------------------- |
| `IStep`                 | Executable pipeline step with context transformation                |
| `IStrategy`             | Strategy interface for trading decisions (execute → StrategyResult) |
| `IOrchestrator`         | Per-position orchestrator managing strategy lifecycle               |
| `IExecutionGate`        | Decision filtering and prioritization gate                          |
| `IExecutor`             | Transaction execution handler for on-chain operations               |
| `IPositionProvider`     | External data source abstraction for positions/markets              |
| `IRpcProvider`          | RPC connection abstraction with retry logic                         |
| `IStore`                | Persistence layer for assignments and execution records             |
| `IPositionStore`        | Persistence layer for known positions                               |
| `IOrchestratorRegistry` | In-memory orchestrator lifecycle manager                            |

See [`interfaces.ts`](../packages/core/src/interfaces.ts) for full interface definitions.
