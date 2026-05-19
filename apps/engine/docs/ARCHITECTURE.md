# Engine Architecture

The `@lp-system/engine` application serves as the composition root, bootstrapping execution loops and exposing an HTTP control plane.

---

## 1. Core Processes

- **Composition Root**: Bootstraps adapters, RPC connections, dynamic persistence stores, orchestrator registries, and executors. Located in `main.ts`.
- **Background Position Sync**: Periodically synchronizes on-chain live positions for registered wallets with local JSON caches using the `PositionSyncService`. This keeps the local store updated with on-chain changes without overloading the RPC endpoints.
- **Synchronous Execution Model**: Executes compound actions (such as `close+open` rebalancing) synchronously in a blocking sequence directly on-chain within HTTP Express controller handlers.
- **REST Control Plane**: Launches an Express HTTP server allowing active monitoring, control, configuration, and manual position tracking.

---

## 2. HTTP Server REST Endpoints

The HTTP server loads dynamic routers and exposes the following concrete REST endpoints:

### A. Assignment Management

- **`GET /assignments`**: Retrieves all persistent strategy assignments.
- **`POST /assignments`**: Creates and persists a new assignment, making it available for on-demand strategy evaluation.
- **`DELETE /assignments/:id`**: Deletes the specified assignment from persistent storage and de-registers its orchestrator from the runtime.

### B. Unified Position Actions

- **`POST /positions/:positionId/actions`**: Performs a unified action on a position.
  - `action: "evaluateStrategy"`: Runs strategy evaluation (includes price enrichment). Requires `strategyId`.
  - `action: "removeLiquidity"`: Removes 100% liquidity and claims fees (closes position).
  - `action: "applySuggestion"`: Applies a strategy recommendation (close, open, or close+open). Requires `strategyId` and `suggestion`.

### D. System Introspection & Status

- **`GET /positions`**: Lists all live, on-chain CLMM positions owned by the configured wallet address.
- **`GET /health`**: Standard liveness probe returning system status (`healthy`) and current epoch timestamp.
- **`GET /docs`**: Interactive Swagger OpenAPI UI documentation.
