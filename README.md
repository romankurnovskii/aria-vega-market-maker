# Aria Vega — Market Maker

A highly structured, stateless-orchestrated automation system for Solana CLMM liquidity provision, targeting Meteora DLMM pools.

## Purpose

To manage and automate concentrated liquidity positions on Solana efficiently across multiple price ranges using deterministic workflow steps.

## Usage

```bash
# install dependencies
pnpm install --ignore-scripts

# compile all packages and apps
pnpm build

# run the engine tick loop
pnpm start

# run local development stack with hot reloading
docker compose -f docker-compose.dev.yml up --build --force-recreate

# run production container build
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# run tests across all packages
pnpm test

# run tests with coverage
pnpm test:coverage

# run tests in watch mode
pnpm test:watch
```

## Structure

- `packages/core` — Shared domain types and interfaces.
- `packages/providers` — RPC connection pool and market-data providers.
- `packages/steps` — Reusable execution units (calculators, range/limit checks).
- `packages/strategy` — End-to-end strategy workflows as composite steps.
- `packages/orchestration` — State coordination, registry, and decision routing.
- `packages/executor` — Transaction dispatching and callback re-evaluation.
- `packages/persistence` — Safe filesystem state adapters.
- `apps/engine` — Application daemon and HTTP control plane.
