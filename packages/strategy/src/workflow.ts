/**
 * @file workflow.ts
 * @description Sequential pipeline executor for strategy steps.
 *
 * @features
 * - Accepts ordered array of IStep instances
 * - Executes each step in sequence, feeding output context into next step's input
 * - Returns final transformed StepContext after all steps complete
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure functional pipeline runner, no state retained between runs
 */
import { IStep, StepContext } from '@lp-system/core';
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
   * @param {StepContext} initialContext - Input context with position, market, params.
   * @returns {Promise<StepContext>} Final context after all steps have executed (may include signal + openParams).
   */
  public async run(initialContext: StepContext): Promise<StepContext> {
    let context = { ...initialContext };
    for (const step of this.steps) {
      logger.info(`[Workflow] Running step: ${step.name}`);
      context = await step.execute(context);
    }
    return context;
  }
}
