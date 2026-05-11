# LP Strategy System — Architecture & Project Structure

This document defines the complete monorepo structure for a Solana CLMM liquidity provision automation system. It focuses on **strategies as stateless workflows**, **clear separation of concerns**, and **deterministic orchestration** across hundreds of positions. The system is ready for implementation by an AI agent.

---

## 1. Repository Layout

```
lp-system/
├── packages/
│   ├── core/                     # Domain types + interfaces (zero deps)
│   ├── providers/                # IPositionProvider + IRpcProvider implementations
│   ├── steps/                    # IStep components (reusable building blocks)
│   ├── strategy/                 # IStrategy implementations (workflows of steps)
│   ├── orchestration/            # Orchestrators, registry, execution gate
│   ├── executor/                 # IExecutor (Solana transaction builder)
│   └── persistence/              # IStore + IPositionStore (JSON file adapters)
├── apps/
│   └── engine/                   # Composition root + tick loop
├── docs/
│   ├── ARCHITECTURE.md           # This document
│   └── INTERFACES.md             # Detailed interface definitions
├── .gitignore
├── package.json                  # Workspace root (pnpm or npm workspaces)
├── tsconfig.base.json
└── README.md
```

---

## 2. Package Descriptions

### 2.1 `packages/core`

**Purpose:** Pure types and interfaces. No runtime dependencies. No async. Only exported types that the whole system shares.

**Files:**

- `types.ts` – `Position`, `TokenAmount`, `OpenParams`, `MarketSnapshot`, `PricePoint`, `StepContext`, `StrategyResult`, `Assignment`, `Decision`, `ExecutionRecord`, `LPEvent`
- `interfaces.ts` – `IStep`, `IStrategy`, `IOrchestrator`, `IExecutionGate`, `IExecutor`, `IPositionProvider`, `IRpcProvider`, `IStore`, `IPositionStore`, `IOrchestratorRegistry`

**Main exports:**

```ts
export * from './types';
export * from './interfaces';
```

### 2.2 `packages/providers`

**Purpose:** Concrete implementations of data and RPC providers.

**Files:**

- `meteora-api-provider.ts` – implements `IPositionProvider` using Meteora Datapi.
- `helio-rpc-provider.ts` – implements `IRpcProvider` for Helius RPC.
- `solana-rpc-provider.ts` – implements `IRpcProvider` for public Solana RPC.
- `rpc-pool.ts` – round‑robin load balancer with 429 backoff.

**Exports:**

```ts
export { MeteoraApiProvider };
export { HelioRpcProvider };
export { SolanaRpcProvider };
export { RpcPool };
```

### 2.3 `packages/steps`

**Purpose:** Reusable, stateless `IStep` components that modify `StepContext`.

**Files:**

- `initialization-check-step.ts`
- `trailing-range-check-step.ts`
- `range-calculator-step.ts`
- `amount-calculator-step.ts`

**Exports:**

```ts
export { InitializationCheckStep };
export { TrailingRangeCheckStep };
export { RangeCalculatorStep };
export { AmountCalculatorStep };
```

### 2.4 `packages/strategy`

**Purpose:** Assemble workflows of steps and implement `IStrategy`.

**Files:**

- `workflow.ts` – runs an array of `IStep` sequentially.
- `trailing-usdc-strategy.ts` – uses `Workflow` with steps: initialization → trailing range → range calc → amount calc.

**Exports:**

```ts
export { Workflow };
export { TrailingUsdcStrategy };
```

### 2.5 `packages/orchestration`

**Purpose:** Orchestrators, registry, execution gate, circuit breaker.

**Files:**

- `circuit-breaker.ts`
- `strategy-orchestrator.ts` – implements `IOrchestrator`, wraps a strategy.
- `orchestrator-registry.ts` – implements `IOrchestratorRegistry`.
- `orchestrator-factory.ts` – creates orchestrators from assignments.
- `execution-gate.ts` – implements `IExecutionGate`, conflict policy + risk (initially null).

**Exports:**

```ts
export { CircuitBreaker };
export { StrategyOrchestrator };
export { OrchestratorRegistry };
export { OrchestratorFactory };
export { ExecutionGate };
```

### 2.6 `packages/executor`

**Purpose:** On‑chain execution via `IRpcProvider`.

**Files:**

- `solana-executor.ts` – implements `IExecutor`, builds and sends close/open/close+open transactions. Uses `IRpcProvider` for connection. For `close+open`, after close confirms, it requests re‑evaluation (calls back to engine via injected `reEvaluate` callback).

**Exports:**

```ts
export { SolanaExecutor };
```

### 2.7 `packages/persistence`

**Purpose:** JSON file storage for assignments and known positions.

**Files:**

- `json-file-store.ts` – implements `IStore`. Files: `assignments.json`, `executions.json`.
- `json-position-store.ts` – implements `IPositionStore`. File: `known_positions.json`.

**Exports:**

```ts
export { JsonFileStore };
export { JsonPositionStore };
```

### 2.8 `apps/engine`

**Purpose:** The running process. Composition root, tick loop, discovery, HTTP endpoints (for manual assignment management).

**Files:**

- `main.ts` – starts everything.
- `server.ts` – optional internal HTTP server (port 3000) to receive assignments and ad‑hoc evaluation requests.

**No business logic inside `engine`** – only wiring and the tick loop.

---

## 3. Core Types & Interfaces (from `core`)

### Position

```ts
interface Position {
  id: string; // on-chain pubkey
  poolAddress: string;
  lowerBinId: number;
  upperBinId: number;
  tokenX: TokenAmount;
  tokenY: TokenAmount;
  isInRange: boolean;
  openedAt: number; // timestamp
  metadata: Record<string, unknown>;
}
```

### MarketSnapshot

```ts
interface MarketSnapshot {
  poolAddress: string;
  activeBinId: number;
  price: number;
  priceHistory: PricePoint[]; // last N minutes, provided by IPositionProvider
  feeRate: number;
  capturedAt: number;
}
```

### StepContext

```ts
interface StepContext {
  position: Position;
  market: MarketSnapshot;
  params: Record<string, unknown>; // strategy config
  signal?: 'skip' | 'close' | 'open' | 'close+open';
  openParams?: OpenParams;
  reason?: string;
}
```

### StrategyResult

```ts
type StrategyResult =
  | { action: 'skip' }
  | { action: 'close' }
  | { action: 'open'; params: OpenParams }
  | { action: 'close+open'; openParams: OpenParams };
```

### Assignment

```ts
interface Assignment {
  id: string;
  strategyId: string; // e.g., 'trailing-usdc'
  positionId: string;
  mode: 'active' | 'monitoring';
  createdAt: number;
}
```

### Decision

```ts
interface Decision {
  positionId: string;
  action: 'close' | 'open' | 'close+open';
  openParams?: OpenParams;
  sourceAssignmentId: string;
  evaluatedAt: number;
}
```

### IPositionProvider

```ts
interface IPositionProvider {
  getPositions(walletAddress: string): Promise<Position[]>;
  getPosition(positionId: string): Promise<Position>;
  getPoolInfo(poolAddress: string): Promise<PoolInfo>; // includes bins, fee, etc.
  // MarketSnapshot is built by combining getPoolInfo + price history
  getMarketSnapshot(poolAddress: string): Promise<MarketSnapshot>;
}
```

### IRpcProvider

```ts
interface IRpcProvider {
  getConnection(): Connection; // Solana web3 Connection
  execute<T>(fn: (conn: Connection) => Promise<T>): Promise<T>;
}
```

### IExecutor

```ts
interface IExecutor {
  apply(
    decision: Decision,
    market: MarketSnapshot,
    reEvaluate: (positionId: string) => Promise<StrategyResult>
  ): Promise<ExecutionRecord>;
}
```

---

## 4. Provider Details

### MeteoraApiProvider (`packages/providers/meteora-api-provider.ts`)

- Uses `fetch` to call Meteora Datapi:
  - `GET /dlmm/v1/positions?wallet={wallet}` → list positions
  - `GET /dlmm/v1/position/{pubkey}` → single position
  - `GET /dlmm/v1/pool/{poolAddress}` → pool info (bin step, fee, active bin)
- Builds `MarketSnapshot.priceHistory` by fetching recent swap events or using a simple time‑weighted price cache (initially empty array for v1).
- Implements `IPositionProvider` fully.

### HelioRpcProvider & SolanaRpcProvider

- Each wraps a single RPC URL.
- `getConnection()` returns a `Connection` with commitment `'confirmed'`.
- `execute(fn)` calls `fn(connection)` and retries on failure (max 3 attempts, 200ms backoff).

### RpcPool

- Accepts an array of `IRpcProvider`.
- Maintains current index.
- `execute(fn)`: tries current provider, if error (status 429 or 5xx) rotates to next provider with Fibonacci backoff (1,2,3,5,8 seconds). After all providers exhausted, throws.
- Also provides `getConnection()` that returns the connection of the current healthy provider.

---

## 5. Engine Startup & Tick Loop

### `apps/engine/main.ts` — Composition

```ts
import {
  MeteoraApiProvider,
  HelioRpcProvider,
  SolanaRpcProvider,
  RpcPool,
} from 'packages/providers';
import { JsonFileStore, JsonPositionStore } from 'packages/persistence';
import { TrailingUsdcStrategy } from 'packages/strategy';
import {
  OrchestratorRegistry,
  OrchestratorFactory,
  ExecutionGate,
} from 'packages/orchestration';
import { SolanaExecutor } from 'packages/executor';
import { startTickLoop, startDiscovery, startHttpServer } from './lifecycle';

const WALLET = process.env.WALLET_PUBKEY;
const TICK_INTERVAL_MS = 10000;

async function main() {
  // Providers
  const helio = new HelioRpcProvider(process.env.HELIO_URL);
  const solana = new SolanaRpcProvider(process.env.SOLANA_URL);
  const rpcPool = new RpcPool([helio, solana]);
  const positionProvider = new MeteoraApiProvider(process.env.METEORA_API_URL);

  // Persistence
  const store = new JsonFileStore('./data');
  const positionStore = new JsonPositionStore('./data');

  // Strategy
  const strategy = new TrailingUsdcStrategy({ rangePercent: 20 });

  // Orchestration
  const registry = new OrchestratorRegistry();
  const factory = new OrchestratorFactory(registry, { strategy }); // maps strategyId → strategy instance
  const executionGate = new ExecutionGate(); // no risk guard initially

  // Executor
  const executor = new SolanaExecutor(rpcPool, WALLET, { priorityFeeMicroLamports: 1000 });

  // Tie executor back to engine's re-evaluation function
  executor.setReEvaluate(async (positionId: string) => {
    const position = await positionProvider.getPosition(positionId);
    const market = await positionProvider.getMarketSnapshot(position.poolAddress);
    const orchestrators = registry.getForPosition(positionId);
    for (const orch of orchestrators) {
      const result = await orch.tick(position, market);
      if (result.action !== 'skip') return result;
    }
    return { action: 'skip' };
  });

  // Start components
  await startDiscovery(positionProvider, positionStore, factory, store);
  startTickLoop(TICK_INTERVAL_MS, positionProvider, registry, executionGate, executor);
  startHttpServer(store, registry, executor); // for manual assignments
}

main();
```

### `apps/engine/lifecycle.ts` — Discovery & Tick Loop

**Discovery** (runs once on startup, then every N minutes optionally):

- Fetch all positions from `IPositionProvider.getPositions(wallet)`
- Compare with `IPositionStore.getKnown()`
- New positions: store, load assignments from `IStore.getAssignments()`, create orchestrators via factory.
- Removed positions: deregister orchestrators, update position store.

**Tick Loop** (every `TICK_INTERVAL_MS`):

```ts
async function tick() {
  const knownPositions = await positionStore.getKnown();
  for (const position of knownPositions) {
    const freshPosition = await positionProvider.getPosition(position.id);
    const market = await positionProvider.getMarketSnapshot(freshPosition.poolAddress);
    const orchestrators = registry.getForPosition(freshPosition.id);

    const activeResults: Recommendation[] = [];
    for (const orch of orchestrators) {
      const result = await orch.tick(freshPosition, market);
      if (result.action !== 'skip' && orch.mode === 'active') {
        activeResults.push({ assignmentId: orch.assignmentId, result });
      }
    }

    const decision = executionGate.consider(activeResults, freshPosition.id);
    if (decision) {
      const record = await executor.apply(decision, market, reEvaluateCallback);
      await store.saveExecutionRecord(record);
    }
  }
}
```

**HTTP Server** (optional, for manual assignment management):

- `POST /assignments` – creates a new assignment, persists, creates orchestrator.
- `DELETE /assignments/:id` – removes, deregisters orchestrator.
- `GET /assignments` – lists from store.
- `POST /strategies/:id/evaluate` – ad-hoc evaluation for a position (returns StrategyResult).

---

## 6. Dependencies & Build

- Use **pnpm workspaces** (or npm/yarn workspaces).
- TypeScript with `"strict": true`.
- Every package has its own `package.json` and `tsconfig.json` extending the root.
- Root `package.json` defines scripts: `build`, `dev`, `clean`.

**Allowed imports** (no upward, no sideways across untrusted layers):

- `core` → nothing
- `providers` → `core`
- `steps` → `core`
- `strategy` → `core`, `steps`
- `orchestration` → `core`, `strategy`
- `executor` → `core`, `providers` (for IRpcProvider)
- `persistence` → `core`
- `engine` → all other packages (composition root)

---

## 7. Initial Implementation Roadmap (for AI agent)

**Phase 1 – Core & Persistence**

- Set up monorepo workspace.
- Implement `packages/core` (all types + interfaces).
- Implement `packages/persistence` (JSON file adapters).

**Phase 2 – Providers**

- Implement `MeteoraApiProvider`, `HelioRpcProvider`, `SolanaRpcProvider`, `RpcPool`.

**Phase 3 – Steps & Strategy**

- Implement `InitializationCheckStep`, `TrailingRangeCheckStep`, `RangeCalculatorStep`, `AmountCalculatorStep`.
- Implement `Workflow` and `TrailingUsdcStrategy`.

**Phase 4 – Orchestration & Executor**

- Implement `CircuitBreaker`, `StrategyOrchestrator`, `OrchestratorRegistry`, `OrchestratorFactory`, `ExecutionGate`.
- Implement `SolanaExecutor` (transaction building uses Meteora DLMM SDK or raw instructions).

**Phase 5 – Engine**

- Write `main.ts`, discovery, tick loop, HTTP server.
- Add environment variable validation, graceful shutdown.

**Phase 6 – Testing**

- Unit tests for each step and strategy.
- Integration test with a localnet (optional but recommended).

---

## 8. Configuration & Environment Variables

```env
# Engine
WALLET_PUBKEY=your_solana_wallet_address
PRIVATE_KEY_BASE64=...   # for signing (or use keypair file)
TICK_INTERVAL_MS=10000

# Providers
METEORA_API_URL=https://dlmm.datapi.meteora.ag
HELIO_URL=https://mainnet.helius-rpc.com/?api-key=xxx
SOLANA_URL=https://api.mainnet-beta.solana.com
```

---

**End of Architecture Document**
