/**
 * @file orchestrator-factory.ts
 * @description Factory for creating StrategyOrchestrator instances from Assignment objects.
 *
 * @features
 * - Creates orchestrator per assignment, merging default strategy params with custom overrides
 * - Validates strategy registration before instantiation
 * - Logs orchestrator creation for observability
 *
 * @dependencies Assignment, IOrchestrator, IStrategy (from @lp-system/core)
 * @sideEffects None — pure factory
 */
import { Assignment, IOrchestrator, IStrategy } from '@lp-system/core';
import { StrategyOrchestrator } from './strategy-orchestrator.js';

/**
 * Orchestrator factory: creates per-assignment orchestrator instances.
 */
export class OrchestratorFactory {
  /**
   * Constructs the factory with registered strategies and default params.
   *
   * @param {Record<string, IStrategy>} strategies - Map of strategy ID → strategy instance.
   * @param {Record<string, unknown>} [defaultParams={}] - Default params merged into all orchestrators.
   */
  constructor(
    private strategies: Record<string, IStrategy>,
    private defaultParams: Record<string, unknown> = {}
  ) {}

  /**
   * Creates a new StrategyOrchestrator for the given assignment.
   * Throws if the strategyId is not registered.
   *
   * @param {Assignment} assignment - The assignment defining position, strategy, and mode.
   * @param {Record<string, unknown>} [customParams={}] - Optional per-call param overrides.
   * @returns {IOrchestrator} Configured orchestrator ready to tick.
   * @throws {Error} If assignment.strategyId is not in the strategies registry.
   */
  public create(assignment: Assignment, customParams: Record<string, unknown> = {}): IOrchestrator {
    const strategy = this.strategies[assignment.strategyId];
    if (!strategy) {
      throw new Error(`Strategy with ID '${assignment.strategyId}' is not registered in this factory`);
    }

    const mergedParams = {
      ...this.defaultParams,
      ...customParams
    };

    console.log(`[OrchestratorFactory] Creating StrategyOrchestrator for assignment ${assignment.id} targeting position ${assignment.positionId}`);
    return new StrategyOrchestrator(
      assignment.id,
      assignment.positionId,
      assignment.strategyId,
      assignment.mode,
      strategy,
      mergedParams
    );
  }
}
