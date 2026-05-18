# Solana CLMM Development Findings & Anti-Patterns

This document tracks critical technical findings, SDK quirks, and architecture "gotchas" discovered during the development of the Aria Vega Market Maker. Every agent working on this repository **must** review these findings to avoid repeating known bugs.

---

## 1. Meteora DLMM SDK Quirks

### Initialization vs. Liquidity Addition

- **The Bug**: Calling `dlmm.addLiquidityByStrategy` (or `addLiquidityByWeight`) on a newly generated Keypair address fails with `AccountOwnedByWrongProgram` (Anchor Error 3007).
- **The Finding**: On Solana, a new address is owned by the System Program. The Meteora DLMM program requires the position account to be initialized and owned by its own program ID (`LBUZKh...`).
- **The Solution**: Always use `dlmm.initializePositionAndAddLiquidityByStrategy` when opening a **new** position. Only use `addLiquidity...` when adding to an existing, already-initialized position account.

### Transaction vs. Instructions

- **The Bug**: Passing raw `Instruction` arrays to SDK methods or trying to mix-and-match manually built transactions often leads to signature verification errors.
- **The Finding**: The Meteora SDK internally handles complex account lookups and compute budget instructions.
- **The Solution**: Prefer the SDK's higher-level transaction builders (e.g., `dlmm.claimSwapFee`, `dlmm.closePosition`) and always wrap them in the `SolanaExecutor`'s simulation and rebroadcast loop.

---

## 2. Engine Orchestration & State

### The "Discovery" Sync Requirement

- **The Bug**: After a successful rebalance (Close -> Open), the engine would error with "Position not found on-chain".
- **The Finding**: The engine uses a local "Known Position" cache. If `Discovery` only runs on startup, the cache becomes stale as soon as a position ID changes (which happens on every rebalance).
- **The Solution**: **Periodic Discovery is mandatory.** Run `startDiscovery` at the beginning of every tick cycle to sync the local cache with on-chain reality.

### Market Snapshot Targeting

- **The Bug**: During the second leg (`open`) of a rebalance, the system failed to fetch a market snapshot.
- **The Finding**: The code was trying to fetch the snapshot using the `positionId`. Since the position was just closed, the API returned a 404.
- **The Solution**: Always fetch market snapshots using the **Pool Address** (which is immutable), not the transient Position ID.

---

## 3. Atomic Task Execution

### The "Stuck Task" Recovery

- **The Bug**: If the engine crashed or was force-restarted during a rebalance, the task would remain in `executing_...` status forever, locking the position.
- **The Finding**: Stateful rebalance tasks need a "Boot Recovery" phase.
- **The Solution**: On engine startup (first run of `processTasks`), explicitly scan for any tasks in `executing_...` states and revert them to `pending_...`. This allows the state machine to resume the interrupted rebalance safely.

### Concurrency Guards

- **The Bug**: Concurrent HTTP requests and Tick Loops were "stealing" tasks from each other, leading to "Task already claimed" warnings or double execution.
- **The Finding**: `JsonFileStore` needs a non-blocking but atomic "Claim" check.
- **The Solution**: Refine `saveTask` to allow updates to a task **only if** the status change is valid (e.g., from `pending` to `executing`) or if the caller is updating an already-claimed task with new events/logs.
