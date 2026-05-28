/**
 * @file workflow.ts
 * @description Sequential pipeline executor for strategy steps.
 *
 * @features
 * - Accepts ordered array of IStep instances
 * - Executes each step in sequence, feeding output context into next step's input
 * - Returns final transformed StepContext after all steps complete
 *
 *
 * @dependencies IStep, PipelineContext (from @lp-system/core)
 * @sideEffects None — pure functional pipeline runner, no state retained between runs
 */
import { IStep, PipelineContext, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('workflow');

export class Workflow {
  /**
   * Constructs a workflow with the configured step chain.
   *
   * @param {IStep[]} steps - Ordered array of pipeline steps.
   */
  constructor(private steps: IStep[]) {}

  /**
   * Runs all steps in sequence starting from initialContext.
   *
   *
   * @param {PipelineContext | StepContext} initialContext - Input context with position, market, params.
   * @returns {Promise<PipelineContext | StepContext>} Final context after all steps have executed.
   */
  public async run(initialContext: PipelineContext | StepContext): Promise<PipelineContext | StepContext> {
    let context = { ...initialContext } as unknown as PipelineContext | StepContext;
    for (const step of this.steps) {
      logger.info(
        `[Workflow] Running step: ${step.descriptor?.name || step.name} [positionId=${initialContext.position.id}]`
      );
      context = await step.execute(context);

      // Support for early halting
      if (context._halted) {
        logger.info(`[Workflow] Pipeline execution halted by step: ${step.descriptor?.name || step.name}`);
        break;
      }
    }
    return context;
  }
}
