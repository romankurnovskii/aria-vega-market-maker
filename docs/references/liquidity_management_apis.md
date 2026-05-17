# Architecture Decision: Unified Position Actions API

## Context and Problem Statement

The system manages liquidity positions through automated strategy-driven rebalancing. However, operators and control panels need the ability to perform unified manual actions:

1. **Evaluate Strategy** — preview what the strategy recommends for a position
2. **Remove Liquidity** — withdraw 100% liquidity from a position (claiming accrued fees automatically)
3. **Add Liquidity** — optional future capability to add liquidity

---

## Decision

We introduce a single unified REST API endpoint on the engine backend:

### Unified Actions API

**Endpoint**: `POST /positions/{positionId}/actions`

**Purpose**: Execute a specified action type on a position.

**Action Types**:

- `evaluateStrategy` — Run strategy evaluation and return recommendation. Requires `strategyId`.
- `removeLiquidity` — Remove all liquidity and claim fees (closes position).
- `addLiquidity` — Add liquidity to existing position (manual).
- `applySuggestion` — Apply a strategy recommendation (close, open, or close+open). Requires `strategyId` and `suggestion`.

#### 1. Evaluate Strategy Action

**Request Body**:

```json
{
  "action": "evaluateStrategy",
  "strategyId": "trailing-usdc"
}
```

**Response** (200):

```json
{
  "status": "success",
  "action": "evaluateStrategy",
  "result": {
    "action": "close+open",
    "openParams": { ... }
  }
}
```

#### 2. Remove Liquidity Action

**Request Body**:

```json
{
  "action": "removeLiquidity"
}
```

**Response** (200):

```json
{
  "status": "success",
  "action": "removeLiquidity",
  "transactionSignatures": ["sig1...", "sig2..."],
  "claimedFees": {
    "tokenX": "2500000",
    "tokenY": "1800000"
  },
  "positionClosed": true
}
```

**Behavior**:

- Uses Meteora SDK's `removeLiquidity()` to withdraw 100% liquidity.
- Accrued swap fees are claimed automatically.

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
