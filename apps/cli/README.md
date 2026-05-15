# CLI — Liquidity Duty Tool

A production-ready command-line interface for manual liquidity provision operations on Meteora DLMM pools.

## Overview

The `avmm` tool allows operators to manually execute liquidity provision steps. It uses the system's core executor and calculation steps to ensure that manual actions are consistent with the automated strategy logic.

- **Executor Reuse:** Delegates all on-chain operations to `@lp-system/executor`.
- **Step Orchestration:** Uses `@lp-system/steps` for range and amount calculations.
- **Safety:** Performs atomic operations with explicit parameters.

## Configuration

The tool requires the following environment variables:

- `RPC_URL`: Solana RPC endpoint (e.g., Helius or Quicknode).
- `PRIVATE_KEY_BASE64`: Solana wallet private key as a Base64 encoded string.

## Usage

The recommended way to run the tool is via the `npm` script. The `--action` flag is mandatory.

```bash
npm run avmm -- --action <action> [options]
```

### 1. Add Liquidity

Opens a brand new position using human-readable token amounts and price range percentages.

```bash
npm run avmm -- --action addLiquidity \
  --pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6 \
  --tokenX So11111111111111111111111111111111111111112 \
  --tokenY EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amountX 0.1 \
  --amountY 10 \
  --rangeLower -0.2 \
  --rangeUpper 0
```

#### Options for `addLiquidity`

| Option         | Description                                            |
| -------------- | ------------------------------------------------------ |
| `--pool`       | Pool address (required)                                |
| `--tokenX`     | Token X mint address (required)                        |
| `--tokenY`     | Token Y mint address (required)                        |
| `--amountX`    | Token X amount (human readable, e.g. 0.1) (required)   |
| `--amountY`    | Token Y amount (human readable, e.g. 10) (required)    |
| `--rangeLower` | Lower price range percentage (e.g., `-0.2`) (required) |
| `--rangeUpper` | Upper price range percentage (e.g., `0`) (required)    |

---

### 2. Remove Liquidity

Performs a full withdrawal of all liquidity and claims all accrued fees/rewards for a specific position.

```bash
npm run avmm -- --action removeLiquidity \
  --pool 5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6 \
  --positionId 2vm9LqqX8X4biuJdQNx2wYpf5KDB9zHbWBWgEdjkWKLG
```

#### Options for `removeLiquidity`

| Option         | Description                          |
| -------------- | ------------------------------------ |
| `--pool`       | Pool address (required)              |
| `--positionId` | Position address to close (required) |

---

### Global Options

| Option          | Description                                 |
| --------------- | ------------------------------------------- |
| `--rpcUrl`      | Overrides `RPC_URL` environment variable    |
| `--priorityFee` | Priority fee in micro-lamports (default: 0) |
| `--help`        | Show help message                           |

## Development

To build the tool for distribution:

```bash
pnpm build
```
