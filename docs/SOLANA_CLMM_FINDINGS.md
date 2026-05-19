# Solana CLMM Development Findings & Anti-Patterns

This document tracks critical technical findings, SDK quirks, and architecture "gotchas" discovered during the development of the Aria Vega Market Maker. Every agent working on this repository **must** review these findings to avoid repeating known bugs.

---

## 1. Meteora DLMM SDK Quirks

### Initialization vs. Liquidity Addition

- **The Bug**: Calling `dlmm.addLiquidityByStrategy` (or `addLiquidityByWeight`) on a newly generated Keypair address fails with `AccountOwnedByWrongProgram` (Anchor Error 3007).
- **The Finding**: On Solana, a new address is owned by the System Program. The Meteora DLMM program requires the position account to be initialized and owned by its own program ID (`LBUZKh...`).

### Transaction vs. Instructions

- **The Bug**: Passing raw `Instruction` arrays to SDK methods or trying to mix-and-match manually built transactions often leads to signature verification errors.
- **The Finding**: The Meteora SDK internally handles complex account lookups and compute budget instructions.
- **The Solution**: Prefer the SDK's higher-level transaction builders (e.g., `dlmm.claimSwapFee`, `dlmm.closePosition`) and always wrap them in the `SolanaExecutor`'s simulation and rebroadcast loop.

---

## 2. Engine Orchestration & State

### Continuous Position Synchronization

- **The Bug**: After a successful rebalance (Close -> Open), the engine would error with "Position not found on-chain" because the local known-position cache became stale when the position ID changed.
- **The Finding**: The engine uses a local "Known Position" cache. Rather than relying on a complex startup discovery routine, position sync must run continuously in the background to ensure that on-chain reality is represented accurately.
- **The Solution**: **Use the background `PositionSyncService`**. It runs in a background thread, polling and syncing on-chain position data for all monitored wallets to the `positionStore` at defined intervals while applying safe RPC rate-limit throttling.

### Market Snapshot Targeting

- **The Bug**: During the second leg (`open`) of a rebalance, the system failed to fetch a market snapshot.
- **The Finding**: The code was trying to fetch the snapshot using the `positionId`. Since the position was just closed, the API returned a 404.
- **The Solution**: Always fetch market snapshots using the **Pool Address** (which is immutable), not the transient Position ID.

---

## 3. Synchronous Execution Model & Robustness

### Asynchronous Tick Loops Removed

- **The Architecture**: All background daemon tick loops and stateful `RebalanceTask` queues have been removed. The engine now operates under a **synchronous API-driven model** where execution requests (`applyStrategy`, `applySuggestion`) are triggered via HTTP endpoints and executed directly on-chain in a blocking sequence.

### Robust Synchronous Rebalancing

- **The Challenge**: Solana transactions can be slow, and compound operations (Close -> Open) run the risk of HTTP timeouts or partial success (i.e. Close succeeds, but Open fails).
- **The Best Practices**:
  1. **Detailed Error Reporting**: If the second leg (`open`) of a rebalance fails after the `close` has completed successfully, the router must return a `500` error with the detailed `closeRecord` and `openRecord` objects included in the response. This guarantees the client UI or caller has full visibility of the transaction signatures and can facilitate manual recovery.
  2. **Compute Budget & RPC Optimization**: Always rely on the `SolanaExecutor`'s internal high-level transaction simulation, priority fee adjustment, and automated rebroadcast loop. This maximizes the probability of transaction land-rate success within the request-response lifecycle.
  3. **Strict Validation**: Validate that any suggestion/strategy output contains all necessary open parameters (`openParams`) and token balance allocations before executing the transaction leg.
