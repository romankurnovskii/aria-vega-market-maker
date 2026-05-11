# System Architecture

The Solana CLMM LP Automation System organizes liquidity provision strategies as **stateless workflows** executing over deterministic orchestration pipelines.

```
                  +-----------------------+
                  |      apps/engine      | (Composition Root & Tick Loop)
                  +-----------+-----------+
                              |
     +------------------------+------------------------+
     |                                                 |
+----v--------------------+               +------------v------------+
| packages/orchestration  |               |    packages/executor    |
+----+--------------------+               +------------+------------+
     | (Tick Decision)                                 | (Actions close/open)
     |                                                 |
+----v--------------------+               +------------v------------+
|    packages/strategy    |               |   packages/providers    |
+----+--------------------+               +-------------------------+
     | (Composite Steps)
     |
+----v--------------------+
|     packages/steps      | (Initialization, Range/Trailing checks)
+----+--------------------+
     | (Pure domain logic)
     v
+-------------------------+
|      packages/core      | (Shared contract models & interfaces)
+-------------------------+
```

## Packages Layout

1. **`packages/core`**: Domain types and interfaces. No dependencies.
2. **`packages/persistence`**: File-based state adapters.
3. **`packages/providers`**: Solana RPC load balancers and Meteora API scrapers.
4. **`packages/steps`**: Small, reusable computational checking units.
5. **`packages/strategy`**: Composition of multiple steps into actionable triggers.
6. **`packages/orchestration`**: Active state registrars, circuit breakers, and risk evaluation gates.
7. **`packages/executor`**: Safe order routing and callback-driven re-evaluations.

## Lifecycle Core Loops

1. **Discovery Loop**: Scrapes the current wallet positions, references them against known JSON tables, and spins up or prunes strategy orchestrators dynamically.
2. **Tick Loop**: Triggers active orchestrators to evaluate on-chain and off-chain data feeds. When steps trigger changes, proposals pass through the risk-gating container to avoid frontrunning, and emit actionable decisions.
3. **Re-Evaluation Loop**: Triggered when compound events like `close+open` occur. Once close logs success on-chain, re-evaluation triggers instantly to calculate fresh ranges and open the replacement position safely.
