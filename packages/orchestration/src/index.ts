/**
 * @file index.ts
 * @description Public API surface for the @lp-system/orchestration package.
 *
 * @features
 * - Re-exports all orchestration classes: CircuitBreaker, StrategyOrchestrator, OrchestratorRegistry, OrchestratorFactory, ExecutionGate
 *
 * @dependencies None
 * @sideEffects None
 */
export { CircuitBreaker } from './circuit-breaker.js';
export { StrategyOrchestrator } from './strategy-orchestrator.js';
export { OrchestratorRegistry } from './orchestrator-registry.js';
export { OrchestratorFactory } from './orchestrator-factory.js';
export { ExecutionGate } from './execution-gate.js';
