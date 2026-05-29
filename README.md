# Aria Vega Market Maker

Aria Vega Market Maker is a specialized, automated liquidity provision and trading system. It features a robust backend engine and a modern React-based frontend.

![Aria Vega Market Maker GUI](./docs/assets/gui_screenshot.png)

## Requirements

- Node.js (v24), pnpm, Docker & Compose.
- **Hummingbot**: Requires running hummingbot bot services concurrently.

## Structure

- `packages/core` — Shared domain types and interfaces.
- `packages/providers` — Meteora Datapi reads + Hummingbot API writes.
- `packages/steps` — Reusable execution units.
- `packages/strategy` — End-to-end strategy workflows.
- `packages/orchestration` — State coordination and decision routing.
- `packages/executor` — Transaction dispatching.
- `packages/persistence` — Safe filesystem state adapters.
- `apps/engine` — Application daemon and HTTP control plane.
- `apps/cli` — Command-line interface.

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

_Note: See [docs/START_HERE.md](./docs/START_HERE.md) for full architecture details._
