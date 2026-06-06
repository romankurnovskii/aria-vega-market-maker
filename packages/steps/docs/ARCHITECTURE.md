# Steps Architecture

The `steps` package holds granular, reusable step modules implementing the `IStep` interface.

## Components

- **`InitializationCheckStep`**: Confirms whether a position has non-zero liquidity and sets the `isEmpty: boolean` field in the context.
- **`TrailingRangeCheckStep`**: Monitors whether the CLMM pool's active bin has moved out of bounds. Writes `isInRange: boolean` to context.
- **`ConditionDecisionStep`**: Generic block evaluating dynamic context fields against numeric thresholds or truthiness to emit signals (`_signal`, `_reason`).
- **`ContextSetupStep`**: Wires position metadata, pool info, and market price snapshots into the evaluation context.

## Design

- **Context Mutation**: Each step receives a shared context object and resolves with a potentially modified context.
- **Pure Functions**: Steps are async, but they avoid writing to any database or local storage; they are entirely stateless.
