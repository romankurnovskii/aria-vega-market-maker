---
name: step-strategy-expert
description: Expert on adding new steps and updating/verifying strategies for LP positions. Use this skill whenever the user mentions steps, strategies, trading logic, execution flows, rebalancing, or wants to modify how positions are managed in the market. It covers both the technical developer aspects (IStep, IStrategy, Workflow) and the financial/trading logic behind them.
---

# Step & Strategy Expert

This skill provides comprehensive guidance for developers and quantitative researchers working on the trading logic of the market maker. It covers the creation and modification of granular "steps" and their orchestration into high-level "strategies."

## Core Concepts

### Steps (`packages/steps`)

Steps are granular, stateless modules that implement the `IStep` interface. They form a pipeline where each step transforms a shared `StepContext`.

- **`IStep` Interface**: Found in `@lp-system/core`.
  ```typescript
  export interface IStep {
    name: string;
    execute(context: StepContext): Promise<StepContext>;
  }
  ```
- **`StepContext`**: Found in `@lp-system/core`.
  - `position`: Current LP position (token amounts, bounds).
  - `market`: Current market snapshot (active price/bound, pool info).
  - `params`: Strategy configuration parameters.
  - `signal`: Decision signal (`skip`, `close`, `open`, `close+open`).
  - `reason`: Human-readable reason for the signal.
  - `openParams`: Parameters for opening a new position (if `signal` is `open` or `close+open`).
  - `calculations`: Computed pricing/geometric metrics.

### Strategies (`packages/strategy`)

Strategies orchestrate steps to form trading rules. They implement the `IStrategy` interface and typically use a `Workflow` runner to execute a sequence of steps.

- **`IStrategy` Interface**: Found in `@lp-system/core`.
  ```typescript
  export interface IStrategy {
    id: string;
    description: string;
    execute(position: Position, market: MarketSnapshot, params: Record<string, unknown>): Promise<StrategyResult>;
  }
  ```
- **`Workflow`**: Sequentially executes a list of `IStep` instances.

---

## Workflow: Adding a New Step

To add a new step (e.g., `MyCustomCheckStep`):

1.  **Create the Implementation**: Create `packages/steps/src/my-custom-check-step.ts`.
2.  **Follow the Pattern**:
    - Use `@lp-system/logger` for structured logging with `[StepName]` prefix.
    - Check for existing `signal` if you shouldn't override prior decisions.
    - Use the spread operator for immutable context updates.
    - Keep it stateless and pure (don't write to DB).

3.  **Register the Step**: Export it from `packages/steps/src/index.ts`.

**Example Pattern:**

```typescript
import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('my-custom-check-step');

export class MyCustomCheckStep implements IStep {
  public name = 'MyCustomCheckStep';

  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Evaluating custom logic for position ${context.position.id}`);

    // If signal already exists and we shouldn't override it:
    if (context.signal) return context;

    // Logic implementation...
    const isConditionMet = true;

    if (!isConditionMet) {
      return {
        ...context,
        signal: 'close',
        reason: 'Condition not met',
      };
    }

    return context;
  }
}
```

---

## Workflow: Updating/Verifying Strategies

To modify how a strategy behaves:

1.  **Modify the Pipeline**: Update the `Workflow` in the strategy's constructor.
    - Adding a step: Insert it into the `Workflow` list in `packages/strategy/src/my-strategy.ts`.
    - Ordering matters: e.g., `InitializationCheckStep` should always be first.

2.  **Update Parameters**: If the new logic requires new config, update the `params` handling.
3.  **Verify Decision Logic**: Ensure the strategy's `execute` method correctly translates the final `StepContext.signal` into a `StrategyResult`.

**Example Update:**

```typescript
// packages/strategy/src/trailing-usdc-strategy.ts

constructor(private defaultParams: Record<string, unknown> = {}) {
  this.workflow = new Workflow([
    new InitializationCheckStep(),
    new MyCustomCheckStep(), // Newly added step
    new TrailingRangeCheckStep(),
    new RangeCalculatorStep(),
    new AmountCalculatorStep(),
  ]);
}
```

---

## Financial & Trading Context

- **Initialization Check**: Prevents errors by ensuring positions actually exist and have liquidity.
- **Range Monitoring**: Detects when the market price (active bin) exits the position's liquidity range.
- **Rebalancing**: Triggering a `close+open` signal to center the position back on the market price.
- **70-Bin Limit**: Meteora DLMM limits position width to 70 bins (69 index difference). Steps must enforce this.
- **Capital Allocation**: `AmountCalculatorStep` handles rolling over current liquidity or applying manual overrides.

## Verification & Testing

1.  **Unit Tests**: Add tests for new steps in `packages/steps/src/__tests__/`.
2.  **Strategy Simulation**: Use the `experimental-strategy-tester` skill to run the strategy against historical or mocked market data.
3.  **Logging Audit**: Verify the logs clearly show the reasoning for every signal change.
