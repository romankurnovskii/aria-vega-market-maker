# Strategy Lifecycle & Position Assignment Flow

## Overview

This document describes how strategies are assigned to positions, how they are evaluated, and what happens when a position is rebalanced (close+open). It documents all edge cases and known gaps in the current implementation.

---

## 1. Architecture Layers

```
┌─────────────────────┐
│   Frontend / CLI    │  HTTP requests
└────────┬────────────┘
         │ POST /assignments, POST /positions/:id/actions
         ▼
┌──────────────────────────────────────────────────────┐
│                   Engine (HTTP Server)                │
│                                                      │
│  ┌─────────────────┐   ┌─────────────────────────┐   │
│  │  assignments.ts  │   │     positions.ts        │   │
│  │  (CRUD + reg.)   │   │ (evaluate + execute)    │   │
│  └────────┬─────────┘   └──────────┬──────────────┘   │
│           │                        │                  │
│           ▼                        ▼                  │
│  ┌──────────────────────────────────────────────┐     │
│  │           Orchestration Layer                │     │
│  │  ┌──────────┐ ┌────────────┐ ┌────────────┐  │     │
│  │  │Registry  │ │  Factory   │ │Orchestrator│  │     │
│  │  │(in mem)  │ │(create)    │ │(tick →     │  │     │
│  │  │          │ │            │ │ strategy)  │  │     │
│  │  └──────────┘ └────────────┘ └────────────┘  │     │
│  └──────────────────────────────────────────────┘     │
│                                                      │
│  ┌─────────────────┐   ┌─────────────────────────┐   │
│  │ HummingbotExec  │   │  PositionSyncService    │   │
│  │ (fetch→Gateway) │   │  (5s poll Datapi)       │   │
│  └────────┬────────┘   └──────────┬──────────────┘   │
└───────────┼───────────────────────┼──────────────────┘
            │ HTTP                  │ HTTP
            ▼                       ▼
     Hummingbot Gateway      Meteora Datapi API
     (tx execution)          (read positions/pools)
```

---

## 2. Strategy Assignment Flow

### 2.1 Creating an Assignment

```
POST /assignments  { id, strategyId, positionId, mode }
  │
  ├─ 1. store.saveAssignment(assignment)     ──► assignments.json
  │
  ├─ 2. factory.create(assignment)
  │      └─ new StrategyOrchestrator({
  │           assignmentId: assignment.id,
  │           positionId: assignment.positionId,  ← IMMUTABLE
  │           strategyId: assignment.strategyId,
  │           mode: assignment.mode,
  │           strategy: resolvedStrategy,
  │           params: mergedParams
  │         })
  │
  └─ 3. registry.register(orchestrator)       ──► in-memory Map
```

The orchestrator is permanently bound to the `positionId` from the assignment. There is no setter to change it.

### 2.2 Evaluating a Strategy on a Position

```
POST /positions/:positionId/actions  { action: 'evaluateStrategy', strategyId }
  │
  ├─ 1. positionProvider.getPosition(positionId)   ──► position data
  ├─ 2. getMarketSnapshot(position.poolAddress)    ──► market data
  ├─ 3. registry.getForPosition(positionId)
  │      └─ filters orchestrators by positionId match
  │      └─ if none found: create ad-hoc orchestrator (not persisted)
  ├─ 4. targetOrch.tick(position, market)
  │      └─ strategy.execute(position, market, params)
  │      └─ returns StrategyResult { action, openParams, signal, reason }
  └─ 5. return result to caller
```

### 2.3 Executing a Strategy (close+open)

```
POST /positions/:positionId/actions  { action: 'applyStrategy', strategyId }
  │
  ├─ [same lookup + tick as evaluateStrategy]
  │
  ├─ If result.action === 'close+open':
  │   │
  │   ├─ STEP 1: Close
  │   │   executor.apply({ action:'close', positionId })
  │   │     └─ Gateway POST /gateway/clmm/close
  │   │     └─ on success: extract tx hash, fees
  │   │
  │   ├─ STEP 2: Archive old position
  │   │   handleArchiveAndCleanup(positionId)
  │   │     └─ mark CLOSED, save to position_history.json
  │   │     └─ REMOVE from known_positions.json
  │   │
  │   ├─ STEP 3: Re-evaluate strategy
  │   │   targetOrch.tick(position, updatedMarket)
  │   │     └─ still uses OLD position data (cached)
  │   │
  │   ├─ STEP 4: Open
  │   │   executor.apply({ action:'open', openParams })
  │   │     └─ Gateway POST /gateway/clmm/open
  │   │     └─ on success: extract tx hash, newPositionId
  │   │
  │   └─ STEP 5: Register new position
  │       handleRegisterNewPosition(newPositionId)
  │         └─ positionProvider.getPosition(newPositionId)
  │         └─ ADD to known_positions.json
  │         └─ ⚠️ NO assignment created
  │         └─ ⚠️ NO orchestrator registered for new positionId
  │
  └─ Return response to caller
```

---

## 3. Edge Cases

### 3.1 Close succeeds → Open times out (Gateway 504)

```
Status: Close archived, capital freed, open never confirmed
Recovery: None automatic
- Capital is back in wallet (SOL refunded)
- No new position on-chain
- Old position is archived (CLOSED)
- Strategy still points to old (non-existent) positionId
- Next manual evaluation will fail to find old position
```

### 3.2 Close succeeds → Open fails (simulation error)

```
Same as 3.1 — capital freed, no position, no auto-retry
```

### 3.3 Close+Open both succeed → New position NOT assigned to strategy

```
Status: Position exists on-chain and in known_positions.json
Gap: No assignment created for new positionId
- Old orchestrator still has positionId = old (archived) position
- registry.getForPosition(newPositionId) returns []
- evaluateStrategy/applyStrategy on new positionId creates ad-hoc orchestrator
- Ad-hoc orchestrators are NOT persisted (vanish on restart)
```

### 3.4 Engine restart → Orchestrators lost

```
Status: assignments.json has records with old positionIds
Gap: No startup restoration of orchestrators
- main.ts creates empty registry + factory
- Never calls store.getAssignments() to rebuild orchestrators
- GET /assignments still returns persisted assignments (with stale positionIds)
- Strategy evaluations on any position create ad-hoc orchestrators
- In-memory registry and orchestrators diverge from persisted assignments
```

### 3.5 Only open (no existing position)

```
POST /gateway/open (via gateway.ts route or applySuggestion 'open')
- No assignment exists for the new position
- Frontend must manually create an assignment after opening
```

### 3.6 PositionSyncService overwrites known positions during close+open

```
Race: PositionSyncService polls every 5s
If it fires between STEP 2 (archive) and STEP 5 (register new):
- It fetches current on-chain positions (may include the old closed position
  if still cached by Meteora, or the new position if already confirmed)
- It calls saveKnown() which REPLACES the entire known_positions.json
- Could restore the just-archived position or pre-maturely add the new one
```

### 3.7 Ad-hoc orchestrator vs registered orchestrator behavior

| Aspect                           | Registered (via POST /assignments) | Ad-hoc (created on demand) |
| -------------------------------- | ---------------------------------- | -------------------------- |
| Persisted in assignments.json    | ✅ Yes                             | ❌ No                      |
| Survives restart                 | ❌ No (not restored)               | ❌ No                      |
| Found by registry.getForPosition | ✅ Yes                             | ❌ No (never registered)   |
| Has assignmentId                 | Real ID                            | `adhoc_<timestamp>`        |
| sourceAssignmentId in decisions  | Real ID                            | `manual` (hardcoded)       |

---

## 4. Known Gaps Summary

| #   | Gap                                     | Impact                                            | Severity |
| --- | --------------------------------------- | ------------------------------------------------- | -------- |
| 1   | No auto-assignment after close+open     | New position orphaned from strategy               | High     |
| 2   | No orchestrator restoration on restart  | Registry empty after restart, ad-hocs used        | High     |
| 3   | No retry when open fails after close    | Capital freed but idle, manual recovery needed    | High     |
| 4   | No TransactionMonitor for timeouts      | Tx may confirm but engine thinks it failed        | Medium   |
| 5   | sourceAssignmentId always 'manual'      | Cannot trace which assignment triggered execution | Low      |
| 6   | Orchestrator positionId immutable       | Cannot repoint orchestrator to new position       | Medium   |
| 7   | CircuitBreaker, ExecutionGate dead code | Unused, confusing                                 | Low      |

---

## 5. Verification Points

To confirm the assignment → evaluation → execution flow works:

1. `POST /assignments` with `{ id, strategyId, positionId, mode }` → 201 + orchestrator registered
2. `POST /positions/:positionId/actions` with `{ action: 'evaluateStrategy', strategyId }` → finds orchestrator by positionId, ticks strategy
3. `POST /positions/:positionId/actions` with `{ action: 'applyStrategy', strategyId }` → close+open executes, new position registered
4. After close+open: `GET /positions` shows new position, old position gone
5. After close+open: `registry.getForPosition(newPositionId)` returns empty (no orchestrator for new pos)
6. After restart: `GET /assignments` shows old assignment, but registry is empty
