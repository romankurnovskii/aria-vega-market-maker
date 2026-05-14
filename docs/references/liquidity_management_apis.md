# Architecture Decision: Manual Liquidity Management APIs

## Context and Problem Statement

The current system manages liquidity positions exclusively through automated strategy-driven rebalancing. However, operators need the ability to manually intervene:

1. **Add Liquidity** — deposit additional tokens into an existing position to increase its size
2. **Remove Liquidity** — withdraw liquidity from a position (claiming all accrued fees automatically)

Currently, no REST API exists to perform these operations on demand.

---

## Decision

We introduce two new REST API endpoints on the engine backend:

### A. Add Liquidity API

**Endpoint**: `POST /positions/{positionId}/add-liquidity`

**Purpose**: Deposit additional token amounts into an existing position, increasing its liquidity allocation.

**Request Body**:

```json
{
  "tokenXAmount": "15000000",
  "tokenYAmount": "12000000",
  "slippageTolerance": 0.01
}
```

| Field               | Type   | Required | Description                                                                                                           |
| ------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------- |
| `tokenXAmount`      | string | Yes      | Raw integer token X amount to deposit (atomic units, e.g., lamports for SOL or micro-USDC). **Not decimal-adjusted.** |
| `tokenYAmount`      | string | Yes      | Raw integer token Y amount to deposit (atomic units, e.g., lamports for SOL or micro-USDC). **Not decimal-adjusted.** |
| `slippageTolerance` | number | No       | Slippage tolerance as decimal (0.01 = 1%, default: 0.01)                                                              |

**Response** (200):

```json
{
  "status": "success",
  "transactionSignatures": ["...", "..."],
  "positionId": "9tA6m91FvP35G9A7eS982Yhd6pE35Z678WjLmoB67Pqr",
  "newLiquidity": {
    "tokenX": "165000000",
    "tokenY": "132000000"
  }
}
```

**Behavior**:

- Uses Meteora SDK's `addLiquidity()` method
- Tokens are distributed across the existing position's bin range using Spot strategy
- Multiple transactions may be returned if the operation exceeds Solana's size limits

---

### B. Remove Liquidity API

**Endpoint**: `POST /positions/{positionId}/remove-liquidity`

**Purpose**: Remove liquidity from a position, optionally specifying the percentage to withdraw. Fees are **automatically claimed** upon removal.

**Request Body**:

```json
{
  "percentage": 100,
  "closePosition": false
}
```

| Field           | Type    | Required | Description                                                               |
| --------------- | ------- | -------- | ------------------------------------------------------------------------- |
| `percentage`    | number  | Yes      | Percentage of liquidity to remove (1-100)                                 |
| `closePosition` | boolean | No       | If true and percentage=100, closes the position account and reclaims rent |

**Response** (200):

```json
{
  "status": "success",
  "transactionSignatures": ["...", "..."],
  "positionId": "9tA6m91FvP35G9A7eS982Yhd6pE35Z678WjLmoB67Pqr",
  "claimedFees": {
    "tokenX": "2500000",
    "tokenY": "1800000"
  },
  "removedLiquidity": {
    "tokenX": "15000000",
    "tokenY": "12000000"
  },
  "positionClosed": false
}
```

**Behavior**:

- Uses Meteora SDK's `removeLiquidity()` with `shouldClaimAndClose: false`
- **Automatically claims accrued swap fees** as part of the removal transaction
- If `closePosition: true` and `percentage: 100`, also calls `closePosition()` to reclaim rent
- Multiple transactions may be returned for wide bin ranges

---

## Open Schema Design

Both endpoints use an **open schema** pattern for extensibility:

```typescript
interface AddLiquidityRequest {
  tokenXAmount: string;
  tokenYAmount: string;
  slippageTolerance?: number;
  strategyType?: 'spot' | 'curve' | 'bidAsk'; // Meteora SDK StrategyType enum: Spot=0, Curve=1, BidAsk=2
  metadata?: Record<string, unknown>;
}

interface RemoveLiquidityRequest {
  percentage: number;
  closePosition?: boolean;
  claimFees?: boolean;
  destinationWallet?: string;
  metadata?: Record<string, unknown>;
}
```

### StrategyType Enum Reference

The Meteora DLMM SDK defines three strategy types:

| Value | Name     | Description                              |
| ----- | -------- | ---------------------------------------- |
| `0`   | `Spot`   | Uniform distribution across bin range    |
| `1`   | `Curve`  | Distribution following the bonding curve |
| `2`   | `BidAsk` | Bid-ask distribution for market making   |

See `packages/providers/src/meteora/meteora-onchain-provider.ts` and `@meteora-ag/dlmm` SDK for implementation.

---

## Technical Implementation Notes

### Provider Layer

The existing `MeteoraOnChainProvider` already has the methods needed:

```typescript
// packages/providers/src/meteora/meteora-onchain-provider.ts
public async buildAddLiquidityInstructions(params: AddLiquidityParams): Promise<TransactionInstruction[]>
public async buildRemoveLiquidityTransactions(params: RemoveLiquidityParams): Promise<Transaction[]>
```

### Executor Integration

| Step | Action                                                    |
| ---- | --------------------------------------------------------- |
| 1    | Validate position exists and belongs to operator's wallet |
| 2    | Build transaction(s) via provider                         |
| 3    | Sign and broadcast with priority fees                     |
| 4    | Poll for confirmation                                     |
| 5    | Update local position cache                               |
| 6    | Return tx signatures and updated position state           |

### State Machine Impact

- **Add Liquidity**: Position remains in `OPEN` state; token amounts increase
- **Remove Liquidity**: Position transitions to `CLOSING` if fully closed, otherwise remains `OPEN`
- Position lifecycle state machine (from `decisions_position_lifecycle.md`) continues to apply

### Safety Gates

1. **Position Ownership Check**: Verify position belongs to operator's wallet
2. **Non-Zero Amounts**: Reject zero or negative token amounts
3. **Execution Lock**: Skip if orchestrator is currently executing on this position
4. **Percentage Bounds**: `percentage` must be 1-100 (or 0.01-1.0 for fractional representation)

---

## Open Questions

1. **Should fee claiming be optional?** Currently fees are auto-claimed on remove. Add a `claimFees: false` option?
2. **Concurrent modification guard**: Should we use the orchestrator's `isExecuting` lock, or implement a separate position-level mutex?
3. **Partial removal granularity**: Support removing specific bin ranges instead of percentage?
4. **Transaction batching**: Should we support multiple positions in a single request?

---

## Consequences

- **Positive**:
  - Operators can adjust position sizing without strategy-driven rebalances
  - Fees are automatically harvested, improving capital efficiency
  - Open schema allows future features without breaking API contracts

- **Negative**:
  - Introduces manual intervention points that bypass strategy gates
  - Requires careful state synchronization with position cache

- **Risks**:
  - Manual operations may conflict with automated rebalances (mitigated by execution lock)
  - Position state drift if cache is not updated after manual operations (mitigated by cache refresh on next tick)

---

## Related Decisions

- `decisions_position_lifecycle.md` — Position lifecycle states
- `ARCHITECTURE.md` — Intent-first rebalance flow
- `INTERFACES.md` — IExecutor interface contracts
