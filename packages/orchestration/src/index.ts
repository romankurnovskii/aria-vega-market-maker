/**
 * @file index.ts
 * @description Public API surface for the @lp-system/orchestration package.
 *
 * @features
 * - Re-exports all orchestration classes: StrategyOrchestrator, OrchestratorRegistry, OrchestratorFactory
 *
 * @dependencies None
 * @sideEffects None
 */
export { StrategyOrchestrator } from './strategy-orchestrator.js';
export { OrchestratorRegistry } from './orchestrator-registry.js';
export { OrchestratorFactory } from './orchestrator-factory.js';
