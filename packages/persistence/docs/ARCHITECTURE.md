# Persistence Architecture

The `persistence` package implements file-system based implementations of the `IStore` and `IPositionStore` contracts using atomic JSON reading and writing.

## Adapters

- **`JsonFileStore`**: Adapts `IStore` to store assignments in `assignments.json` and execution histories in `executions.json`.
- **`JsonPositionStore`**: Adapts `IPositionStore` to keep track of known, currently open positions in `known_positions.json`.

## Safety Guidelines

1. **Atomic File Write**: Ensure files are written securely to prevent partial state corruption on sudden daemon failures.
2. **Directory Bootstrapping**: Automatically initializes the target database directories on startup if they do not exist.
