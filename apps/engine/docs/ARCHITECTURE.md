# Engine Architecture

The `engine` application acts as the composition root and orchestrates operational loops.

## Processes

- **Composition**: Resolves and connects the providers, persists adapters, strategies, registries, and mock executers in `main.ts`.
- **Discovery**: Queries wallet positions on start and syncs them with known position JSON maps to configure active orchestrators dynamically.
- **Tick Loop**: Runs continuously to trigger structured rebalance checks on all active tracking positions.
- **HTTP Server**: Launches a standard Express REST panel to let users manage positions and query trading performance on the fly.
