# Aria Vega — Market Maker

A highly structured, stateless-orchestrated automation system for CLMM liquidity provision, using the Hummingbot API.

## Purpose

To manage and automate concentrated liquidity positions efficiently across multiple price ranges using deterministic workflow steps.

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
```

## Structure

- `packages/core` — Shared domain types and interfaces.
- `packages/providers` — Hummingbot API providers.
- `packages/steps` — Reusable execution units (calculators, range/limit checks).
- `packages/strategy` — End-to-end strategy workflows as composite steps.
- `packages/orchestration` — State coordination, registry, and decision routing.
- `packages/executor` — Transaction dispatching (via Hummingbot).
- `packages/persistence` — Safe filesystem state adapters.
- `apps/engine` — Application daemon and HTTP control plane.
- `apps/cli` — Command-line interface for manual liquidity duty operations.
