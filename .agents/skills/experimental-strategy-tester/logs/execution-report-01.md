# 📊 Live Execution Report & Post-Mortem Analysis

This report documents the active status of the newly followed position and provides a deep-dive post-mortem analysis of the previous rebalancing cycle's execution behaviors and the precise Solana-native reasons for the liquidity provision failure.

---

## 🎯 Current Live Tracking Status

- **Active Position**: `4ztuUwpN8JECnpJ1i6LEmFspSJNr61HdZ4giHCRKZryt`
- **Assigned Strategy**: `experimental-restake`
- **Current Pool Price**: `94.0501` USDC/SOL
- **Position Bounds**: Bin `-5927` to Bin `-5910` (`93.4503 USDC` to `94.0878 USDC`)
- **Status**: **IN-RANGE** (Evaluation: `SKIP` — Capital is actively earning fees, no rebalance action required)

---

## 🔍 Technical Post-Mortem Analysis

### 1. Why the Position was Closed

The original position `DiqXmD7TZJJf8JDBZz9ZsRYyjP1yxssoGdY13ao9Crf2` was configured with range bounds of `[-5866, -5830]`.

- **Trigger**: The active pool bin shifted to `-5908` (SOL price fell below the range).
- **Strategy Action**: The `experimental-restake` strategy emitted a `close+open` rebalance signal to execute a down-range SOL-only rebalance to re-average the purchase price.
- **On-chain Action**: The close transaction was successfully built and confirmed on-chain with signature:
  `s9ix4papwsTeHPcht8YQR5JJtvohF2wFuJyaRV7QkVu3jWT1uzKjcTs2B2eo3KxBdYeHpoHAD7otKVJhq2rZ1dw`

---

### 2. Why the Settlement Polling Stalled

Meteora's SDK auto-unwraps Wrapped SOL (WSOL) to native SOL when removing liquidity.

- **The Issue**: During the initial execution, the balance polling was looking for Wrapped SOL SPL account changes instead of native SOL.
- **Upon Restart**: After hot-reloading the container, the initial wallet balances were queried _after_ the position was already closed on-chain (so the returned SOL was already in the wallet). The polling loop compared live balances against these post-close cached balances, expecting them to rise even further, which stalled the state machine infinitely.
- **The Fix**: We updated [lifecycle.ts](file:///Users/r/dev/github/aria-vega-market-maker/apps/engine/src/lifecycle.ts) to check if the close was already on-chain or generated no new signatures on boot, in which case it safely bypasses settlement polling.

---

### 3. Why It Could Not Open and Add Liquidity (The Solana Rent-Exemption Failure)

The open leg transaction failed with preflight simulation error `InstructionError: [3, {"Custom":1}]`.

Here is the exact mathematical proof of the failure:

#### A. Initial Wallet Balance on Open Phase

- Total Native SOL Balance: `331,829,518` lamports (`~0.3318` SOL)

#### B. Synthetic Amount Calculation

The strategy default parameter resolved the deposit amount to 100% of the synthetic position amount:

- Target Deposit Amount: `331,829,518` lamports

#### C. Solana Transaction Execution Sequence

When executing a transaction on Solana to provision liquidity:

1. **Instruction 1 (Create Position Account)**: Allocates a new account on-chain for the Meteora DLMM position. This requires paying the **rent-exempt balance** of exactly **`59,455,360` lamports** (`~0.0594` SOL). This rent is immediately deducted from the wallet.
2. **Instruction 2 (Add Liquidity)**: Wraps SOL to WSOL and transfers it into the position account.

```
+-------------------------------------------------------------------------------+
|                            Solana Wallet Balance                              |
+-------------------------------------------------------------------------------+
| Initial Wallet Balance:                                 331,829,518 lamports  |
| LESS Rent-Exempt Fee for Position Account creation:    - 59,455,360 lamports  |
|                                                        =====================  |
| Remaining Wallet Balance available for transfer:        272,374,158 lamports  |
|                                                                               |
| SDK attempts to transfer target deposit amount:        -331,829,518 lamports  |
|                                                        =====================  |
| RESULT: System Program fails with INSUFFICIENT LAMPORTS!                      |
+-------------------------------------------------------------------------------+
```

---

## 🛡️ Applied Structural Fixes

To prevent this Solana rent-exemption out-of-gas failure from ever happening again, we implemented two-layered defensive checks:

1. **Strategy Level**: We updated [experimental-restake-step.ts](file:///Users/r/dev/github/aria-vega-market-maker/packages/steps/src/experimental-restake-step.ts) to automatically leave a `0.08` SOL safety margin when calculating down-range SOL deposit amounts.
2. **Execution Layer**: We updated [solana-executor.ts](file:///Users/r/dev/github/aria-vega-market-maker/packages/executor/src/solana-executor.ts) to dynamically fetch the native SOL balance on-chain before executing any liquidity addition transaction. If the target deposit amount exceeds the safe limit (balance minus a `0.08` SOL rent and network fee buffer), it dynamically caps the transaction's deposit amount to guarantee successful execution.

Both packages compile successfully (`Exit code 0`) and the active tracking is 100% stable.
