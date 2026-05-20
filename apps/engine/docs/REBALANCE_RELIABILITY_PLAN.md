# Rebalance Reliability Plan

Based on [STRATEGY_LIFECYCLE.md](STRATEGY_LIFECYCLE.md) gaps.

Each step is ordered so that later steps depend on earlier ones being correct.
Every step includes a **verification measure** and a **regression check** that
all previous step goals remain satisfied.

---

## Step 0: Remove dead orchestration code

Remove `CircuitBreaker`, `ExecutionGate`, and `IExecutionGate` — they are never imported or used.

### Goal

Clean up codebase, remove confusion, shrink surface area.

### Verification

- `rg 'CircuitBreaker|ExecutionGate|IExecutionGate' --include '*.ts' packages/ apps/` returns only the deleted files in git history
- `pnpm --filter @lp-system/orchestration build` passes
- `pnpm --filter @lp-system/engine build` passes
- `pnpm --filter @lp-system/core build` passes

### Regression check

- `POST /assignments` still creates assignment + registers orchestrator
- `POST /positions/:id/actions` with `evaluateStrategy` still returns strategy result
- All existing tests pass: `pnpm --filter @lp-system/engine test`
- All existing tests pass: `pnpm --filter @lp-system/orchestration test`
- All existing tests pass: `pnpm --filter @lp-system/core test`

---

## Step 1: Orchestrator restoration on startup

On engine boot, load persisted assignments from `store.getAssignments()` and
rebuild orchestrators via `factory.create()` + `registry.register()`.

### Goal

Orchestrators survive restart and are in registry immediately after boot.

### Verification

- Before restart: `POST /assignments` with `{ id: 'test-1', strategyId: 'trailing-usdc', positionId: 'pos-1', mode: 'active' }` → 201
- Restart engine
- `GET /assignments` returns the assignment (persisted)
- `registry.getForPosition('pos-1')` returns the orchestrator (not empty)
- `POST /positions/pos-1/actions` with `{ action: 'evaluateStrategy', strategyId: 'trailing-usdc' }` finds the orchestrator (not ad-hoc)

### Regression check (Step 0 + Step 1)

- Dead code still gone (Step 0 verify)
- `POST /assignments` → 201, orchestrator registered
- `POST /assignments` → then restart → orchestrator restored
- `DELETE /assignments/:id` → orchestrator deregistered, not restored on next restart

---

## Step 2: Auto-assign strategy to new position after close+open

When `close+open` succeeds in `positions.ts`, create a new assignment for the
new `positionId` with the same strategy. Update the old orchestrator's positionId
(or create a new one and register it, then archive the old).

### Goal

After close+open, the new position is automatically assigned to the same strategy.

### Design options

**Option A (recommended):** After `handleRegisterNewPosition()` succeeds, call
`handleReassignPosition(oldPositionId, newPositionId, strategyId)` which:

1. Creates a new assignment with new `positionId`, same `strategyId`, new `id`
2. Saves to store
3. Creates new orchestrator via factory, registers in registry
4. Returns the new assignment

**Option B:** Add `setPositionId(newPositionId)` to `IOrchestrator` interface
and update the existing orchestrator. Simpler but mutates the orchestrator.

Prefer Option A because it keeps a clean audit trail (each assignment = one position).

### Verification

- `POST /assignments` with `strategyId: 'trailing-usdc', positionId: 'pos-A'`
- `POST /positions/pos-A/actions` with `{ action: 'applyStrategy', strategyId: 'trailing-usdc' }` → triggers close+open
- New position `pos-B` is created
- `GET /assignments` returns an assignment for `pos-B` with strategy `trailing-usdc`
- `registry.getForPosition('pos-B')` returns an orchestrator
- `POST /positions/pos-B/actions` with `{ action: 'evaluateStrategy', strategyId: 'trailing-usdc' }` finds the registered orchestrator (not ad-hoc)

### Regression check (Steps 0, 1, 2)

- Dead code still gone
- Restart → orchestrators restored
- New position after close+open has an assignment + orchestrator
- Old assignment for `pos-A` still exists (or is archived) — audit trail preserved

---

## Step 3: TransactionMonitor for Gateway timeouts

When the Gateway returns a 504 timeout (open tx submitted but not confirmed),
the engine should not treat it as definitive failure. Instead:

1. Return `202 Accepted` to caller immediately
2. Background-poll Meteora Datapi for a new position in the same pool + price range
3. If position appears within N attempts (e.g. 30 attempts × 2s = 60s): register it
4. If position never appears: the close already freed capital, next strategy tick
   will detect idle capital and re-open naturally

### Goal

Gateway timeouts no longer cause permanent state inconsistency. The engine self-heals.

### Verification

- Mock Gateway returns 504 for open (no tx hash)
- `close+open` flow returns `202 { status: 'pending', message: '...' }`
- Within 30 seconds, the new position appears in Meteora Datapi
- `known_positions.json` contains the new position
- `GET /positions` shows the new position

### Failure case verification

- Mock Gateway returns 504 for open, and tx never confirms
- `close+open` returns `202 { status: 'pending' }`
- After 60s, TransactionMonitor logs "not confirmed, giving up"
- Capital is in wallet (close already freed it)
- `POST /positions/:oldPositionId/actions` with `evaluateStrategy` returns
  `{ action: 'skip' }` because old position is archived
- This is expected — manual or automated re-trigger needed

### Regression check (Steps 0, 1, 2, 3)

- All previous verifications pass
- Gateway 200 response for open still works (fast path, no TransactionMonitor needed)
- `handleRegisterNewPosition` still works for the fast path

---

## Step 4: Capital-detection re-evaluation (optional enhancement)

After a close+open partial failure (close succeeded, open never confirmed), the
engine should detect that capital is idle and automatically re-trigger strategy
evaluation for the pool.

This is a stretch goal — the `PositionSyncService` already polls position data,
but it does not trigger strategy evaluation. Adding a "no position but expected
one" heuristic would close the loop completely.

### Goal

No manual intervention needed after a close+open timeout failure. The system
eventually re-deploys freed capital.

### Verification

- Close succeeds, open times out and never confirms
- Within 2 tick cycles (default 120s each), the engine detects:
  - No active position in the pool
  - Wallet has un-deployed balance
  - Triggers a fresh strategy evaluation
- A new position is opened automatically

### Regression check (Steps 0-4)

- All previous verifications pass
- Normal close+open (Gateway 200) still works and does NOT trigger the
  capital-detection path (because a position already exists)
