# Aria Vega Market Maker: Stateful Rebalance & Intent Architecture

This document defines the **Task-Intent (Write-Ahead Intent)** architecture designed to ensure atomic integrity during position rebalancing. This architecture prevents "Ghost Position" errors and manages signal decay during network congestion.

Following the refactor to use the Hummingbot API, the system offloads direct blockchain execution and data fetching to the Hummingbot Gateway.

---

## 2. High-Level Domain Architecture

The system is organized into a vertical hierarchy where the **Task Store** acts as the persistent "glue" between strategy logic and execution via the Hummingbot API.

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
        TS --> |"3. Monitors Intent"| EX[Hummingbot Executor]
    end

    subgraph Persistence_Layer [Persistence Layer]
        TS --- JF[data/tasks.json]
    end

    subgraph Execution_Layer [Execution Layer]
        EX --> |"4. JIT Evaluation"| ST[Strategy]
        EX --> |"5. API Call"| RPC[Hummingbot API]
    end
```

</details>

---

## 3. Architectural Pillar: The Rebalance Task Store

To resolve state blindness, the system moves from a "Reactive" model to an **Intent-First** model.

### A. Data Model: `RebalanceTask`

A persistent record stored in `data/tasks.json` that tracks the lifecycle of a rebalance.

| Field                | Type       | Description                                                       |
| :------------------- | :--------- | :---------------------------------------------------------------- |
| `id`                 | `string`   | Unique UUID for the rebalance operation.                          |
| `assignmentId`       | `string`   | Link to the strategy configuration.                               |
| `status`             | `string`   | `pending_close` → `awaiting_settlement` → `pending_open`.         |
| `originalPositionId` | `string`   | The ID of the position being closed.                              |
| `intent`             | `Decision` | The full `Decision` object, including range and metadata.         |
| `evaluatedAt`        | `number`   | Timestamp of the strategy evaluation for JIT staleness checks.    |
| `closeBalances`      | `object`   | Snapshot of token balances at the moment of `close` confirmation. |

> [!IMPORTANT]
> **Data Integrity and Schema Validation**
> All persistence files must be loaded with strict schema validation (e.g., Zod). A corrupted `tasks.json` is a worst-case failure mode, and structural validation ensures the state machine never operates on partial or malformed data.

### B. Stateful Rebalance Flow (Atomic Integrity)

This flow ensures that if the system crashes after closing a position, it knows exactly how to resume the "open" leg.

<details>
<summary>Show Mermaid Source</summary>

```mermaid
sequenceDiagram
    participant OR as Orchestrator
    participant TS as Task Store
    participant EX as Hummingbot Executor
    participant WAL as Wallet ATAs
    participant RPC as Hummingbot API

    Note over OR, RPC: Intent Stage
    OR->>TS: SaveTask (Status: pending_close)

    Note over OR, RPC: Close Leg
    EX->>RPC: Send close request
    RPC-->>EX: Confirmed
    EX->>TS: UpdateTask (Status: awaiting_settlement)

    Note over OR, RPC: Settlement & JIT Evaluation
    loop Polling
        EX->>RPC: Query balances or state
    end
    RPC-->>EX: Funds Settled

    EX->>OR: Trigger JIT Re-evaluation
    OR->>EX: Fresh OpenParams

    Note over OR, RPC: Open Leg
    EX->>RPC: Send open request
    RPC-->>EX: Confirmed
    EX->>TS: DeleteTask (Cleanup)
```

</details>

---

## 4. Recovery Flow (Agnostic Discovery)

Upon startup, the engine synchronizes live data from the Hummingbot API with local persistent intents.

<details>
<summary>Show Mermaid Source</summary>

```mermaid
flowchart LR
    Start([Engine Start]) --> LoadTasks[Load data/tasks.json]
    LoadTasks --> LoadChain[Fetch Live Positions via Hummingbot]

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

- **TTL Validation**: The executor compares `Date.now() - task.evaluatedAt` against a configurable `MAX_SIGNAL_AGE_MS` threshold.
- **JIT Trigger**: If the signal is stale, the executor transitions the task back to `awaiting_settlement` to trigger a re-tick and get fresh boundaries/rates.

---

## 6. The Synthetic Position Factory

When a position is closed, the system cannot fetch its state directly. The **Synthetic Position Factory** bridges this gap during the `awaiting_settlement` phase by using settled tokens attributable to the task.

---

## 7. Key Engineering Guardrails

- **Execution Lock**: The `Orchestrator` uses a public `isExecuting` flag to ignore new `Tick Loop` signals while a `RebalanceTask` is in progress.
- **Write-Ahead Intent**: The `RebalanceTask` is written to disk _before_ the first transaction is signed.
- **Circuit Breakers**:
  - **Hummingbot API**: Enforces a maximum snapshot age to prevent the Tick Loop from evaluating positions against stale market snapshots.
  - **API Circuit Breaker**: Halts new task generation and pauses in-flight tasks if the Hummingbot API error rate exceeds configured thresholds.

---

# Appendix B: Stateless Rebalancing (v2)

> **Status**: Proposed for Issue #39  
> **Goal**: Simplify the state machine by eliminating `awaiting_settlement` and the JIT polling loop

---

## B.3 Stateless Rebalance Flow

```mermaid
sequenceDiagram
    participant TL as Tick Loop
    participant TS as Task Store
    participant EX as Hummingbot Executor
    participant ST as Strategy
    participant RPC as Hummingbot API

    Note over TL, RPC: Tick N: Close Phase
    TL->>TS: Load tasks (status: pending_close)
    TS-->>TL: [task1]
    TL->>EX: executor.apply(close)
    EX->>RPC: Send close request
    RPC-->>EX: Confirmed
    EX-->>TL: { status: 'success' }
    TL->>TS: deleteTask(task1.id)

    Note over TL, RPC: Tick N+1: Open Decision Phase
    TL->>RPC: Fetch wallet balances
    RPC-->>TL: Free balance detected
    TL->>ST: strategy.evaluate(walletBalance, market)
    ST-->>TL: Fresh openIntent
    TL->>TS: createTask(pending_open, intent: openIntent)
    TL->>EX: executor.apply(open)
    EX->>RPC: Send open request
    RPC-->>EX: Confirmed
    EX-->>TL: { status: 'success' }
    TL->>TS: deleteTask(task2.id)
```
