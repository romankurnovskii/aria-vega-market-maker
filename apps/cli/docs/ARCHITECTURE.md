# CLI — Liquidity Duty Tool

A command-line interface for manual liquidity provision operations on Meteora DLMM pools.

## Overview

The `liqifduty` tool allows operators to manually execute liquidity provision steps without running the full engine daemon. This is useful for emergency adjustments, testing new ranges, or one-off position management.

## Installation

```bash
pnpm install
pnpm build --filter @lp-system/cli
```

The binary will be available as `liqifduty` after building.

## Usage

```bash
liqifduty --pool <address> --tokenX <mint> --tokenY <mint> --amountX <amount> --amountY <amount> --rangeLower <pct> --rangeUpper <pct>
```

### Options

| Option | Description |
|--------|-------------|
| `--pool` | Pool address (required) |
| `--tokenX` | Token X mint address (required) |
| `--tokenY` | Token Y mint address (required) |
| `--amountX` | Token X amount (required) |
| `--amountY` | Token Y amount (required) |
| `--rangeLower` | Lower price range percentage (e.g., `-0.2`) (required) |
| `--rangeUpper` | Upper price range percentage (e.g., `0`) (required) |
| `--help` | Show help message |

### Example

```bash
liqifduty \
  --pool 7nTABH6GfWrVvrsKxnKVQaZjnEgEwkAoTxv6UrsS1uZ \
  --tokenX So11111111111111111111111111111111111111112 \
  --tokenY EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --amountX 10 \
  --amountY 1000 \
  --rangeLower -0.2 \
  --rangeUpper 0
```
