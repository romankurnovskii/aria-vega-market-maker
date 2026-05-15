# Solana CLMM Expert Skill

This skill provides critical domain knowledge for working with Solana CLMM (Meteora DLMM) positions and engine orchestration in this repository. It is designed to prevent repeating known integration bugs.

## Usage Guidelines

Use this skill whenever you are:
1.  Modifying `MeteoraOnChainProvider` or any Meteora SDK calls.
2.  Refactoring the engine's `lifecycle.ts` or `processTasks` loop.
3.  Debugging "Position not found" or "Account owned by wrong program" errors.

## Critical Findings

### 1. Position Initialization
- **Rule**: Never use `addLiquidityByStrategy` for new positions.
- **Why**: New accounts are owned by the System Program. Meteora requires initialization.
- **Fix**: Use `dlmm.initializePositionAndAddLiquidityByStrategy`.

### 2. State Synchronization
- **Rule**: Run `Discovery` in every tick loop cycle.
- **Why**: Rebalances change Position IDs. Local caches become stale immediately.
- **Fix**: Ensure `startDiscovery` is called in the main loop to sync the registry.

### 3. Market Targeting
- **Rule**: Use Pool Addresses for market snapshots.
- **Why**: Position IDs are transient and destroyed during rebalances.
- **Fix**: `const poolAddress = intent.openParams?.poolAddress || intent.positionId;`

### 4. Task Recovery
- **Rule**: Always run a "Boot Recovery" on startup.
- **Why**: Interrupted rebalances leave positions "locked" in executing states.
- **Fix**: Revert `executing_...` tasks to `pending_...` during the first run of `processTasks`.

## Reference Documentation

Detailed findings can be found in [docs/SOLANA_CLMM_FINDINGS.md](file:///Users/r/dev/github/aria-vega-market-maker/docs/SOLANA_CLMM_FINDINGS.md).
