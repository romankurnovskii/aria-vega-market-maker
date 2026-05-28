/**
 * @file data-driven-strategy.ts
 * @description A generic IStrategy implementation that executes JSON-defined step pipelines.
 *
 * @features
 * - Constructs a sequential Workflow dynamically from a StrategyDefinition
 * - Instantiates steps via the StepRegistry
 * - Maps PipelineContext outcomes back to StrategyResult
 *
 * @dependencies IStrategy, StrategyResult, StrategyDefinition, PipelineContext (from @lp-system/core), Workflow, StepRegistry
 * @sideEffects None
 */
import {
  IStrategy,
  Position,
  MarketSnapshot,
  StrategyResult,
  StrategyDefinition,
  PipelineContext,
  OpenParams,
  CalculatedPrices,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { Workflow } from './workflow.js';
import { StepRegistry } from './step-registry.js';

const logger = getLogger('data-driven-strategy');

export class DataDrivenStrategy implements IStrategy {
  public id: string;
  public description: string;

  /**
   * @param definition JSON-serializable definition of the strategy and its steps.
   * @param stepRegistry Registry used to instantiate steps by ID.
   */
  constructor(
    private definition: StrategyDefinition,
    private stepRegistry: StepRegistry
  ) {
    this.id = definition.id;
    this.description = definition.description;
  }

  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    logger.info(`[DataDrivenStrategy:${this.id}] Executing strategy for position ${position.id}`);

    const mergedParams = {
      ...this.definition.defaultParams,
      ...params,
    };

    // 1. Build pipeline from definition
    const steps = this.definition.steps.map((s) => {
      // Merge step-level default params from definition with runtime global params if needed,
      // though typically steps read from context.params or their own initialized params.
      // We pass the step's specific definition params directly to its factory.
      return this.stepRegistry.create(s.stepId, s.params);
    });

    const workflow = new Workflow(steps);

    // 2. Initialize the universal pipeline context
    // Note: We use type assertion since PipelineContext expects to have all fields,
    // and older steps might expect StepContext. We'll map standard ones.
    const initialContext: PipelineContext = {
      position,
      market,
      params: mergedParams,
    };

    // 3. Run pipeline
    const finalContext = (await workflow.run(initialContext as unknown as PipelineContext)) as PipelineContext;

    logger.info(
      `[DataDrivenStrategy:${this.id}] Finished evaluation. Signal: ${finalContext.signal || finalContext._signal || 'skip'}. Reason: ${finalContext.reason || finalContext._reason || 'None'}`
    );

    // 4. Map context -> StrategyResult
    // Support both new _ prefixed fields and legacy fields for backward compatibility
    const signal = (finalContext._signal || finalContext.signal || 'skip') as string;
    const reason = (finalContext._reason || finalContext.reason) as string | undefined;
    const openParams = (finalContext._openParams || finalContext.openParams) as OpenParams | undefined;
    const metrics = finalContext.calculations as CalculatedPrices | undefined;

    if (signal === 'close+open' && openParams) {
      return {
        action: 'close+open',
        openParams,
        signal,
        reason,
        metrics,
      };
    }

    if (signal === 'close') {
      return {
        action: 'close',
        signal,
        reason,
        metrics,
      };
    }

    if (signal === 'open' && openParams) {
      return {
        action: 'open',
        openParams,
        signal,
        reason,
        metrics,
      };
    }

    return {
      action: 'skip',
      signal,
      reason,
      metrics,
    };
  }
}
