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

To assign the custom strategy to an active position, update `data/HU5H_YUQh_dev_assignments.json` or use the Express REST endpoints (`POST /assignments`) to map the `positionId` to your new `strategyId` (e.g. `experimental-restake`):

```json
{
  "id": "asg_experimental_001",
  "strategyId": "experimental-restake",
  "positionId": "<TARGET_POSITION_ID>",
  "mode": "active",
  "createdAt": 1778539772220
}
```

### 3. Container Refresh

Rebuild the container with the new strategy code and hot-reload configs:

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### 4. Continuous Log Monitoring

Evaluate the strategy every 60 seconds. Read the container's standard output to check:

- Pool Price vs Position Range Bounds.
- Logic evaluations (e.g. "Price is above current range -> trigger close+open" or "Price is below range -> skip").
- Write-ahead task queuing and execution tracking.

---

## 🛠️ Diagnostics Checklist

- **Verify Type Safety**: Confirm `pnpm build` finishes with `exit code 0`.
- **Examine JSON State**: Check `data/*_tasks.json` to verify write-ahead task status transitions.
- **Inspect Transaction Signatures**: Follow all on-chain signatures on Solana FM or Solscan to confirm unilateral USDC deposit bounds.
