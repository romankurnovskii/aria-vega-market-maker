# Orchestration Architecture

The `orchestration` package manages active strategy instances, links them to assignments, and routes execution results.

## Key Modules

- **`CircuitBreaker`**: Halts operations on abnormal error patterns or flash price movements.
- **`StrategyOrchestrator`**: Adapts an `IStrategy` instance to a stateful `IOrchestrator` managing a single live assignment.
- **`OrchestratorRegistry`**: Maintains in-memory indices of all active orchestrators, grouped by position.
- **`OrchestratorFactory`**: Scaffolds dynamic orchestrators from stored assignments.
- **`ExecutionGate`**: Evaluates recommendations across multiple active strategies to resolve conflicts and output structured execution decisions.
