# Aria Vega Market Maker: Stateful Rebalance & Intent Architecture

This document defines the **Task-Intent (Write-Ahead Intent)** architecture designed to ensure atomic integrity during position rebalancing. This architecture prevents "Ghost Position" errors and manages signal decay during network congestion.

---

## 1. The Core Problem: Partial Execution

In a high-frequency CLMM environment, a rebalance consists of two distinct on-chain events: **Closing** an old position and **Opening** a new one.

- **State Blindness**: If the system relies solely on the blockchain for state, it "forgets" its intent the moment the `close` transaction succeeds because the position PDA is deleted.
- **Signal Decay**: RPC delays (e.g., HTTP 429) can stall execution, making the original strategy decision stale by the time the system is ready to open the second leg.

---

## 2. High-Level Domain Architecture

The system is organized into a vertical hierarchy where the **Task Store** acts as the persistent "glue" between strategy logic and on-chain execution.

![High-Level Domain Architecture](assets/package_dependency_architecture.svg)

<details>
<summary>Show Mermaid Source</summary>

```mermaid
graph TD
    subgraph Application_Layer [Application Layer]
        TL[Tick Loop] --> |"1. Signals close+open"| OR[Orchestrator]
    end

    subgraph Orchestration_Layer [Orchestration Layer]
        OR --> |"2. Writes RebalanceTask"| TS[(Task Store)]
        TS --> |"3. Monitors Intent"| EX[Solana Executor]
    end

    subgraph Persistence_Layer [Persistence Layer]
        TS --- JF[data/tasks.json]
    end

    subgraph Execution_Layer [Execution Layer]
        EX --> |"4. JIT Evaluation"| ST[Strategy]
        EX --> |"5. Signed Tx"| RPC[Solana Mainnet]
    end
```

</details>

---

## 3. Architectural Pillar: The Rebalance Task Store

To resolve state blindness, the system moves from a "Reactive" model to an **Intent-First** model.

### A. Data Model: `RebalanceTask`

A persistent record stored in `data/tasks.json` that tracks the lifecycle of a rebalance.

| Field                | Type       | Description                                                    |
| :------------------- | :--------- | :------------------------------------------------------------- |
| `id`                 | `string`   | Unique UUID for the rebalance operation.                       |
| `assignmentId`       | `string`   | Link to the strategy configuration.                            |
| `status`             | `string`   | `pending_close` → `awaiting_settlement` → `pending_open`.      |
| `originalPositionId` | `string`   | The ID of the position being closed.                           |
| `intent`             | `Decision` | The full `Decision` object, including range and metadata.      |
| `evaluatedAt`        | `number`   | Timestamp of the strategy evaluation for JIT staleness checks. |

### B. Stateful Rebalance Flow (Atomic Integrity)

This flow ensures that if the system crashes after closing a position, it knows exactly how to resume the "open" leg using the tokens now sitting in the wallet.

![Stateful Rebalance Flow](assets/tick_cycle_rebalance_flow.svg)

<details>
<summary>Show Mermaid Source</summary>

```mermaid
sequenceDiagram
    participant OR as Orchestrator
    participant TS as Task Store
    participant EX as Solana Executor
    participant WAL as Wallet ATAs
    participant RPC as Solana RPC

    Note over OR, RPC: Intent Stage
    OR->>TS: SaveTask (Status: pending_close)

    Note over OR, RPC: Close Leg
    EX->>RPC: Send close transaction
    RPC-->>EX: Confirmed (PDA Deleted)
    EX->>TS: UpdateTask (Status: awaiting_settlement)

    Note over OR, RPC: Settlement & JIT Evaluation
    loop Polling
        EX->>WAL: Query balances (USDC/SOL)
    end
    WAL-->>EX: Funds Settled ($1.80 USDC)

    EX->>OR: Trigger JIT Re-evaluation
    OR->>EX: Fresh OpenParams (Staleness Checked)

    Note over OR, RPC: Open Leg
    EX->>RPC: Send open transaction
    RPC-->>EX: Confirmed (New PDA Created)
    EX->>TS: DeleteTask (Cleanup)
```

</details>

### C. The Write-Ahead Workflow

1. **Intent Phase**: Before any transaction is signed, the `Tick Loop` writes a `RebalanceTask` to the `Task Store`.
2. **Execution Phase**: The `SolanaExecutor` processes the task. Upon confirming the `close` transaction, it updates the task status to `awaiting_settlement`.
3. **Recovery Phase**: If the bot restarts, the `Discovery Loop` reads the `Task Store`. If a task is `awaiting_settlement`, it skips the search for the missing position and resumes the `open` leg.

---

## 4. Recovery Flow (Agnostic Discovery)

Upon startup, the engine synchronizes live blockchain data with local persistent intents to ensure no capital is left stranded in the wallet.

![Recovery Flow](assets/recovery_flow_startup.svg)

<details>
<summary>Show Mermaid Source</summary>

```mermaid
flowchart LR
    Start([Engine Start]) --> LoadTasks[Load data/tasks.json]
    LoadTasks --> LoadChain[Fetch Live Positions from Chain]

    subgraph Discovery_Logic [Agnostic Discovery]
        LoadChain --> Match{Task Exists?}
        Match -- Yes (awaiting_settlement) --> Synth[Build Synthetic Position from Wallet]
        Match -- No --> Active[Standard Orchestration]
    end

    Synth --> Resume[Resume 'Open' Leg]
    Active --> Loop[Start Tick Loop]
```

</details>

---

## 5. Just-In-Time (JIT) Re-Evaluation

To mitigate signal decay, the system enforces a **Staleness Check** before the final `open` transaction.

- **TTL Validation**: The executor compares `Date.now() - task.evaluatedAt` against a `MAX_SIGNAL_AGE_MS` threshold (default: `10000ms`).
- **JIT Trigger**: If the signal is stale, the executor transitions the task back to `awaiting_settlement` to trigger a re-tick and get fresh boundaries/rates.

---

## 6. The Synthetic Position Factory

When a position is closed, the system cannot fetch its state from the chain. The **Synthetic Position Factory** bridges this gap during the `awaiting_settlement` phase.

1. **Wallet Polling**: The bot queries the wallet's Associated Token Accounts (ATAs) to verify funds have settled.
2. **Synthesis**: It builds a `Position` object in memory using live wallet balances.
3. **Injection**: This synthetic object is passed to the `TrailingUsdcStrategy`, allowing the `AmountCalculatorStep` to roll over the exact tokens currently held in the wallet.

---

## 7. Key Engineering Guardrails

- **Execution Lock**: The `Orchestrator` uses a public `isExecuting` flag to ignore new `Tick Loop` signals while a `RebalanceTask` is in progress.
- **Write-Ahead Intent**: The `RebalanceTask` is written to disk _before_ the first transaction is signed, ensuring crash-recovery is possible.
- **Signal TTL**: Decisions are timestamped with `evaluatedAt`. If the delay exceeds `MAX_SIGNAL_AGE_MS`, the Executor forces a re-evaluation to account for price drift.
- **Fail-Safe**: If a `RebalanceTask` remains in the store for more than 5 minutes without completion, it triggers an emergency error alert as wallet capital is idle.
