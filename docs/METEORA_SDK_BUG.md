# Meteora DLMM SDK Bug: `getAllLbPairPositionsByUser` crashes on certain wallets

## Overview

`@meteora-ag/dlmm` versions **1.7.5 through 1.9.10** (all published versions)
contain a bug in `getAllLbPairPositionsByUser()` that crashes or returns corrupted
data for wallets with positions that have uninitialized fee state.

---

## Bug Details

| Field                 | Value                                                                      |
| --------------------- | -------------------------------------------------------------------------- |
| **SDK**               | `@meteora-ag/dlmm`                                                         |
| **Installed version** | `1.7.5` (SDK internal version `0.9.1`)                                     |
| **Latest version**    | `1.9.10` (SDK internal version `0.9.7`)                                    |
| **Bug exists in**     | All versions `1.7.5` – `1.9.10`                                            |
| **GitHub issue**      | [#245](https://github.com/MeteoraAg/dlmm-sdk/issues/245) — OPEN            |
| **PR with fix**       | [#281](https://github.com/MeteoraAg/dlmm-sdk/pull/281) — OPEN (not merged) |
| **Reported**          | Oct 27, 2025                                                               |
| **PR opened**         | Apr 9, 2026                                                                |

### Symptom 1: Crash

```
Cannot read properties of undefined (reading 'feeAmountXPerTokenStored')
```

### Symptom 2: Corrupted data (observed in our environment)

The SDK does not always crash — it sometimes returns position data with
corrupted internal state. This causes downstream calls to
`PublicKey.toBase58()` to throw:

```
Non-base58 character
```

---

## Root Cause

In `processPosition()` inside the SDK's `dist/index.js`:

```javascript
const feeInfo = feeInfos[idx]; // <-- can be undefined
const newFeeX = mulShr(
  posShares[idx].shrn(SCALE_OFFSET),
  bin.feeAmountXPerTokenStored.sub(feeInfo.feeXPerTokenComplete), // <-- crash
  SCALE_OFFSET,
  1
);
```

When a position spans more bins than the `feeInfos` array length,
`feeInfos[idx]` returns `undefined`. Any access to `feeInfo.feeXPerTokenComplete`
throws `Cannot read properties of undefined`.

In some cases the iteration succeeds but fee data gets corrupted, and
the returned `lbPairPositionsData` entries contain invalid `PublicKey`
values. Downstream `.toBase58()` then throws `Non-base58 character`.

---

## Fix Status

**The fix has NOT been merged or published.**

PR [#281](https://github.com/MeteoraAg/dlmm-sdk/pull/281) adds a null check:

```javascript
const feeInfo = feeInfos[idx];
if (feeInfo) {
  // fee calculations here
}
```

The PR is still open and awaiting review. No version of the npm package
(`1.7.5` through `1.9.10`) includes this fix.

---

## Our Workaround

**File patched:** `/home/gateway/dist/connectors/meteora/meteora.js`

**Method:** `getRawPosition(positionAddress, wallet)`

**Approach:** Bypass `DLMM.getAllLbPairPositionsByUser()` entirely. Read
the position directly from the Solana chain:

1. `connection.getAccountInfo(positionPubkey)` — read raw position account
2. Extract pool address from position data (bytes 8–40):
   `new PublicKey(positionAccount.data.slice(8, 40))`
3. `this.getDlmmPool(poolAddress)` — create DLMM pool instance
4. `dlmmPool.getPosition(positionPubkey)` — get single position directly

This avoids the buggy batch-fetch path entirely. The fix applies to every
endpoint that calls `getRawPosition`:

- `close-position`
- `position-info` (via `getPositionInfo`)
- `open-position` (via initial position read)

### Patch location

Runtime-only patch applied to the compiled JS inside the Gateway container.
To make permanent, update the Dockerfile or source at:
`hummingbot-gateway/src/connectors/meteora/meteora.ts`.

---

## Recommendation

1. **Short-term:** The runtime patch is sufficient. No urgency to update the SDK.
2. **Long-term:** When PR [#281](https://github.com/MeteoraAg/dlmm-sdk/pull/281)
   is merged, update the SDK to the version containing the fix and remove
   the workaround. Update
   `packages/executor/src/hummingbot-executor.ts` to restore the SDK path.
3. **Alternative:** The `getPositionInfoByAddress` method already exists in
   the same class and reads positions correctly without the buggy SDK call.
   Consider making it the standard path.
