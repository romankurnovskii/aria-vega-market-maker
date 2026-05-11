# Aria Vega Market Maker: System Architecture

## 1. System Overview

The Aria Vega Market Maker is an institutional-grade, highly decoupled Node.js/TypeScript monorepo designed for high-frequency liquidity provision on the Solana blockchain. It utilizes a "Dual-Truth" architecture, combining REST-based market intelligence with absolute on-chain state verification to manage Concentrated Liquidity Market Maker (CLMM) positions on Meteora.

## 2. Core Design Principles

- **Lean Code Discipline:** Zero speculative architecture. Packages are strictly scoped to their immediate responsibilities.
- **Vertical Dependency Flow:** Lower-level packages (`core`, `persistence`) have zero dependencies on higher-level execution or orchestration logic.
- **Fail-Fast Execution:** Silent fallbacks are prohibited. Missing private keys or invalid execution states trigger immediate process termination (`process.exit(1)`) to protect capital.
- **Stateless Pipelines:** Trading logic is divided into atomic, stateless "Steps" that mutate a single `StepContext`, enabling pure functional testing without blockchain mocks.

## 3. Monorepo Package Structure

The system is organized into a strict hierarchy of independent packages:

### Level 1: Foundations

- **`@lp-system/core`**: The absolute source of truth. Contains domain models, interfaces (`IStep`, `IStrategy`, `IExecutor`), and shared types. Contains **zero runtime dependencies**.
- **`@lp-system/persistence`**: Handles atomic local state management via JSON file stores (e.g., `JsonFileStore`). Mounted via Docker volumes for persistence across container lifecycles.

### Level 2: Infrastructure & Data

- **`@lp-system/providers`**: The bridging layer to external data.
  - `RpcPool`: Provides high-availability round-robin routing and failover for Solana RPC nodes (e.g., Helius, Mainnet-Beta).
  - `MeteoraApiProvider`: Ingests historical market metrics and OHLCV data for strategy calculations.
  - `MeteoraOnChainProvider`: Interfaces directly with the ledger to build transaction instructions and verify exact bin states, bypassing API indexing delays.

### Level 3: Business Logic (The Pipeline)

- **`@lp-system/steps`**: Atomic, functional logic units (e.g., `InitializationCheckStep`, `RangeCalculatorStep`, `AmountCalculatorStep`) that process market data.
- **`@lp-system/strategy`**: Workflows (e.g., `TrailingUsdcStrategy`) that chain `Steps` together into a cohesive `Decision` generator.

### Level 4: Control & Execution

- **`@lp-system/orchestration`**: The command center.
  - `CircuitBreaker`: Halts execution upon consecutive failure thresholds.
  - `ExecutionGate`: Prioritizes conflict resolution (e.g., prioritizing `close+open` over `open`).
  - `OrchestratorRegistry`: Maintains the active in-memory mapping of strategies to on-chain positions.
- **`@lp-system/executor`**: The hardened transaction dispatcher (`SolanaExecutor`). Features dynamic Compute Unit (CU) simulation with a 15% safety buffer, UDP "Spam Loops" for delivery assurance during network congestion, and strict `confirmed`/`finalized` consensus requirements.

### Level 5: Application Root

- **`apps/engine`**: The execution daemon. Bootstraps the environment, initializes the `RpcPool`, runs the background `TickLoop`, and exposes the REST HTTP Control Plane.

## 4. Critical Lifecycles

### The Discovery Loop

Executes on startup and periodically to sync local state with the blockchain:

1. Fetches all live DLMM positions for the configured wallet.
2. Cross-references live positions against assigned strategies in local storage.
3. Spins up or spins down `Orchestrator` instances to match the true on-chain state.

### The Tick Loop & Execution Gate

Executes every `TICK_INTERVAL_MS` for active assignments:

1. Fetches a fresh `MarketSnapshot`.
2. Pipes data through the assigned Strategy Workflow.
3. Evaluates the resulting `Decision` against the `ExecutionGate` and `CircuitBreaker`.
4. Dispatches approved transactions to the `SolanaExecutor`.

### Mitigating the "Balance Race Condition"

During compound `close+open` rebalancing events, the system explicitly enforces a sequential lock:

1. The `close` transaction is spammed and confirmed.
2. The Executor verifies the PDA is deleted on-chain.
3. The system applies a hard buffer (e.g., 2000ms) to allow RPC token account indexers to synchronize.
4. A `reEvaluate` callback fires, calculating the new `open` amounts based on the guaranteed, settled ATA balances.
