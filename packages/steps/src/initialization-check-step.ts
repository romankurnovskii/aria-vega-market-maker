/**
 * @file initialization-check-step.ts
 * @description First pipeline step: validates that the position has liquidity before proceeding.
 *
 * @features
 * - Checks both tokenX and tokenY amounts for zero liquidity
 * - Sets 'isEmpty' to true if both amounts are zero, false otherwise
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure check with no state mutation
 */
import { IStep, StepContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('initialization-check-step');

export class InitializationCheckStep implements IStep {
  public name = 'InitializationCheckStep';

  public readonly descriptor: StepDescriptor = {
    id: 'initialization-check',
    name: 'Initialization Check',
    description: 'Validates that the position has non-zero liquidity. Sets isEmpty field in context.',
    category: 'guard',
    inputs: [{ key: 'position', type: 'Position', description: 'Current LP position state' }],
    outputs: [{ key: 'isEmpty', type: 'boolean', description: 'Whether the position holds zero liquidity' }],
    params: [],
  };

  /**
   * Executes the initialization check.
   *
   * @param {StepContext} context - Pipeline context carrying position, market, params.
   * @returns {Promise<StepContext>} Updated context with isEmpty=true/false.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Checking initialization status for position: ${context.position.id}`);

    const hasLiquidityX = parseFloat(context.position.tokenX.amount) > 0;
    const hasLiquidityY = parseFloat(context.position.tokenY.amount) > 0;
    const isEmpty = !hasLiquidityX && !hasLiquidityY;

    logger.info(`[${this.name}] Position ${context.position.id} initialization status: isEmpty=${isEmpty}`);
    return {
      ...context,
      isEmpty,
    };
  }
}
