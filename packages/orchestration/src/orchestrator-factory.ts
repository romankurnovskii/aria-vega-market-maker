import { Assignment, IOrchestrator, IStrategy } from '@lp-system/core';
import { StrategyOrchestrator } from './strategy-orchestrator.js';

export class OrchestratorFactory {
  constructor(
    private strategies: Record<string, IStrategy>,
    private defaultParams: Record<string, unknown> = {}
  ) {}

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
