# Steps Architecture

The `steps` package holds granular, reusable step modules implementing the `IStep` interface.

## Components

- **`InitializationCheckStep`**: Confirms that a position is alive and holds valid assets.
- **`TrailingRangeCheckStep`**: Monitors whether the CLMM pool's active bin has moved out of bounds. Also writes `isInRange: boolean` to context.
- **`RangeCalculatorStep`**: Computes a new, balanced bin range surrounding the current active bin.
- **`AmountCalculatorStep`**: Identifies asset allocations needed to establish the new position.
- **`ConditionDecisionStep`**: Generic block evaluating dynamic context fields against numeric thresholds or truthiness to emit signals (`_signal`, `_reason`).
- **`RsiIndicatorStep`**: Computes Relative Strength Index (RSI) using Wilder smoothing over a configurable period.
- **`SmaIndicatorStep`**: Computes Simple Moving Average (SMA) and determines if the current price is above/below it.

## Design

- **Context Mutation**: Each step receives a shared context object and resolves with a potentially modified context.
- **Pure Functions**: Steps are async, but they avoid writing to any database or local storage; they are entirely stateless.
