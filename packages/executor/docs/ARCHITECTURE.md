# Executor Architecture

The `executor` package coordinates transaction creation and on-chain dispatching.

## Key Modules

- **`SolanaExecutor`**: Implements the `IExecutor` contract. Builds close/open transactions and handles the re-evaluation loops needed for sequential rebalancing actions (like `close+open`).

## Core Re-Evaluation Loop

For complex rebalances such as `close+open`, the executor:

1. Submits the `close` transaction.
2. Waits for finality confirmation.
3. Invokes an injected async callback (`reEvaluate`) to calculate the optimal pricing bands.
4. Executes the subsequent `open` transaction based on the new conditions.
