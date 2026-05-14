---
name: experimental-strategy-tester
description: Guides and automates testing of experimental CLMM strategies (e.g., experimental-restake) on active Meteora DLMM positions while monitoring live container logs and evaluating state transitions.
---

# Experimental Strategy Tester Skill

This skill provides a structured, automated workflow for testing and validating custom, experimental market-maker strategies (such as `experimental-restake`) on live Meteora DLMM positions.

---

## 🎯 When to Use This Skill

Use this skill whenever you need to:

- Assign an experimental trading strategy to an active on-chain position.
- Trigger real-time rebalance evaluations.
- Monitor execution logs and verify that the strategy executes custom rules (such as unilateral restaking, directional boundaries, or skipping actions based on price).

---

## 📋 Experimental Workflow Guidelines

Follow these exact steps to run a strategy experiment:

### 1. Strategy Setup

Confirm that the strategy class (e.g., `ExperimentalRestakeStrategy`) is fully implemented under `packages/strategy/src/` and registered inside `apps/engine/src/main.ts`.

### 2. Assignment

**Agents CANNOT update JSON files directly for assignments.**
To assign the custom strategy to an active position, use ONLY the REST API requests defined in the schema from `apps/engine/src/openapi.yaml`. See [Aria MM Control Plane API Specifications](file:///Users/r/dev/github/aria-vega-market-maker/.agents/skills/experimental-strategy-tester/references/api_spec.md) for endpoint details. You must map the `positionId` to your new `strategyId` (e.g., `experimental-restake`) using the API.

### 3. Container Refresh

Rebuild the container with the new strategy code and hot-reload configs:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### 4. Position Lineage & Single-Target Enforcement (CRITICAL)

- **Enforce Single Target**: Strictly monitor ONLY the specific target position ID requested by the user, and any child positions dynamically spawned from it.
- **Trace the Lineage**: When the framework closes the target position and spawns a new one (via `close+open`), update the monitoring database and logs to track the new child position ID as the direct successor.
- **Do Not Auto-Associate**: Never bind the strategy to other unrelated active positions found in the wallet. If the target position is no longer active and has no pending child task, halt and ask for user confirmation.

### 4. Position Lineage & Single-Target Enforcement (CRITICAL)

- **Enforce Single Target**: Strictly monitor ONLY the specific target position ID requested by the user, and any child positions dynamically spawned from it.
- **Trace the Lineage**: When the framework closes the target position and spawns a new one (via `close+open`), update the monitoring database and logs to track the new child position ID as the direct successor.
- **Do Not Auto-Associate**: Never bind the strategy to other unrelated active positions found in the wallet. If the target position is no longer active and has no pending child task, halt and ask for user confirmation.

### 5. Continuous Log Monitoring (Managed Scripts)

Use the managed monitoring scripts with proper process lifecycle control:

```bash
# Position-based monitoring (static position ID)
.agents/skills/experimental-strategy-tester/scripts/monitor-strategy.sh <POSITION_ID> start
# => starts daemonized, creates PID file, rotates old logs (keep 10)

# Dynamic monitoring (assignment-based, tracks lineage automatically)
.agents/skills/experimental-strategy-tester/scripts/monitor-strategy-dynamic.sh <ASSIGNMENT_ID> start

# Control
monitor-strategy.sh <POSITION_ID> status        # show PID & report path
monitor-strategy.sh <POSITION_ID> logs          # tail current report
monitor-strategy.sh <POSITION_ID> stop          # stop gracefully
monitor-strategy.sh <POSITION_ID> restart       # stop → start
monitor-strategy.sh <POSITION_ID> clean         # delete logs >7d + stale PIDs
```

**Scripts features:**

- `start` — daemonizes, writes PID to `.agents/skills/experimental-strategy-tester/logs/pids/monitor-<ID>.pid`, rotates old reports (keeps last 10)
- `stop` — terminates by PID, removes PID file, detects and cleans stale PIDs
- `status` — reports running state, paths (PID, stdout/stderr, report file)
- `logs` — tails the current report in follow mode
- `clean` — removes logs older than 7 days and stale PID files

**Important**: Scripts append updates every 60 seconds to a **single report file**. Each invocation creates one file (not per-update). The dynamic variant automatically tracks position lineage through the assignment JSON in `data/*_assignments.json`. Never run multiple concurrent monitors for the same position/assignment — `start` guards against duplicates.

---

## 🛠️ Diagnostics Checklist

- **Verify Type Safety**: Confirm `pnpm build` finishes with `exit code 0`.
- **Examine JSON State**: Check `data/*_tasks.json` to verify write-ahead task status transitions.
- **Inspect Transaction Signatures**: Follow all on-chain signatures on Solana FM or Solscan to confirm unilateral USDC deposit bounds.
- **REST Control Endpoints**: See [Aria MM Control Plane API Specifications](file:///Users/r/dev/github/aria-vega-market-maker/.agents/skills/experimental-strategy-tester/references/api_spec.md) for endpoint descriptions.
