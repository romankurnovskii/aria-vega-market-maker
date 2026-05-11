# Executor Architecture

The `@lp-system/executor` package coordinates transaction construction, simulation, signed-dispatching, on-chain finality confirmation, and stateful rebalance monitoring.

---

## 1. Key Modules

- **`SolanaExecutor`**: Implements the `IExecutor` contract. Built for Solana CLMM pools (Meteora DLMM). Manages stateful, multi-leg operations including sequential `close+open` rebalancing via the Task-Intent lifecycle.

---

## 2. Stateful Rebalance Cycle (Task-Intent Integration)

Under the Task-Intent architecture the executor operates phase-by-phase, persisting state to `data/tasks.json` between each leg so that a crash at any point leaves the system in a recoverable state.

### Phase 1: `pending_close`

1. The executor receives the `Decision` from the tick loop.
2. It executes the on-chain `close` transaction for `decision.positionId`.
3. It polls for transaction confirmation using connection-level commitment polling.
4. On confirmation, it calls `store.saveTask({ ...task, status: 'awaiting_settlement' })` and records the close tx signature.

### Phase 2: `awaiting_settlement` (ATA polling)

1. The executor polls the wallet's Associated Token Accounts (ATAs) via `getParsedTokenAccountsByOwner` until the expected token balances increase, confirming the closed position's funds have fully settled.
2. Polling retries every 2 seconds with a 60-second hard timeout. On timeout the task remains `awaiting_settlement` and the fail-safe alert fires.
3. Once settlement is confirmed, the executor builds a **Synthetic Position** (see Section 3) and moves to Phase 3.

### Phase 3: `pending_open` (JIT signal validation)

This phase has two distinct entry points: the normal forward path from Phase 2, and the recovery path where the engine restarts with a task already in `awaiting_settlement`. Both paths converge at the same JIT check.

**JIT staleness check:**

```
if (Date.now() - task.evaluatedAt > MAX_SIGNAL_AGE_MS) → stale
```

`MAX_SIGNAL_AGE_MS` defaults to `10_000` (10 seconds). If the signal is stale:

1. The executor calls `store.saveTask({ ...task, status: 'awaiting_settlement', evaluatedAt: Date.now() })`.
   - Note: `evaluatedAt` is updated here to the re-evaluation timestamp, not left as the original. This prevents the check from firing again immediately on the next pass.
2. The executor calls the injected `reEvaluate(task.originalPositionId)` callback directly — **it does not wait for the next `setInterval` tick**. This callback is provided by the tick loop at the point the executor was invoked and is held in scope for the lifetime of the task execution. It calls `strategy.execute()` with a fresh `MarketSnapshot` and the Synthetic Position, returning a new `StrategyResult`.
3. If the new result is `close+open` or `open`, the executor updates `task.intent` with the fresh `Decision`, persists it, and proceeds to the open transaction.
4. If the new result is `skip` or `close`, the executor logs a warning, deletes the task, and unlocks the orchestrator without opening. Capital remains in the wallet until the next tick cycle discovers the settled balance.

**If the signal is fresh:**

1. The executor executes the on-chain `open` transaction using `task.intent.openParams`.
2. On confirmation, it sets `task.newPositionId` to the new position's public key.
3. It calls `store.saveTask({ ...task, newPositionId })` for a brief window before deletion. This ensures that a crash between the open confirmation and the cleanup leaves a recoverable record.
4. It calls `store.deleteTask(task.id)`.
5. It sets `orchestrator.isExecuting = false` to resume normal tick evaluation.

---

## 3. The Synthetic Position Factory

Closed positions are pruned on-chain. The Synthetic Position Factory constructs an in-memory `Position` object during `awaiting_settlement` so strategy steps — specifically `AmountCalculatorStep` — can compute correct open parameters using the actual settled wallet balances rather than the now-deleted on-chain state.

**Construction steps:**

1. Call `getParsedTokenAccountsByOwner` for both the token X mint and token Y mint associated with the original pool.
2. Read the settled lamport amounts from the parsed account data.
3. Construct a `Position` object using:
   - `tokenX.amount` and `tokenY.amount` from the live ATA balances
   - `lowerBound`, `upperBound`, `poolAddress`, `chain`, `protocol` from `task.intent` (the original `Decision` carries these via `OpenParams`)
   - `isInRange: false` — the position is not yet open
   - `openedAt: Date.now()`
4. Pass this synthetic `Position` to `strategy.execute()` via the `reEvaluate` callback.

The synthetic position is never persisted to `IPositionStore` and is never visible to the discovery loop. It exists only for the duration of the `reEvaluate` call.

---

## 4. Engineering Guardrails

- **`isExecuting` lock**: When the tick loop creates a `RebalanceTask`, it sets `orchestrator.isExecuting = true` before writing the task to disk. The tick loop skips any position whose orchestrator has `isExecuting === true`. The executor resets it to `false` only after `store.deleteTask()` completes successfully. If the executor errors before deletion, the flag stays `true` — the 5-minute fail-safe handles this case.

- **Write-ahead ordering**: The task is written to `data/tasks.json` before the first transaction is signed. If the engine crashes between writing the task and sending the close transaction, the discovery loop finds a `pending_close` task at startup with no matching on-chain position that has been deleted. In this case the task is stale (no close occurred), and the startup recovery deletes the task and re-registers the orchestrator normally. A `pending_close` task is only acted on if `originalPositionId` is absent from the live chain positions — confirming the close actually executed.

- **Fail-safe timeout**: If a task remains in any status for more than 5 minutes (`TASK_TIMEOUT_MS = 300_000`), the engine emits an emergency-level log and triggers a configurable alert webhook. Capital is idle in the wallet. The task is not automatically deleted — manual intervention is required to avoid acting on potentially stale data.

- **`newPositionId` on recovery**: During startup recovery, if the discovery loop finds a task in `awaiting_settlement` where `newPositionId` is already set, the open leg succeeded but cleanup failed. The loop registers an orchestrator for `newPositionId`, deletes the task, and continues normally.
