/**
 * @file amount-calculator-step.ts
 * @description Final step: determines token amounts for new position during rebalance.
 *
 * @features
 * - Runs only when openParams already exist (after RangeCalculatorStep)
 * - Dynamically rolls over the exact token amounts currently held in the position
 * - Propagates existing openParams fields unchanged except amounts
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure calculation
 */
import { IStep, StepContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('amount-calculator-step');

export class AmountCalculatorStep implements IStep {
  public name = 'AmountCalculatorStep';

  public readonly descriptor: StepDescriptor = {
    id: 'amount-calculator',
    name: 'Amount Calculator',
    description: 'Calculates token amounts for a new position during rebalance (default: rolls over exact amounts).',
    category: 'amount',
    inputs: [
      { key: 'openParams', type: 'OpenParams', description: 'Requires initialized openParams' },
      { key: 'position', type: 'Position', description: 'Reads existing token amounts' },
    ],
    outputs: [{ key: 'openParams', type: 'OpenParams', description: 'Updates tokenXAmount and tokenYAmount' }],
    params: [
      { key: 'tokenXAmount', type: 'string', description: 'Manual override for token X amount' },
      { key: 'tokenYAmount', type: 'string', description: 'Manual override for token Y amount' },
    ],
  };

  /**
   * Fills in the token allocation amounts in openParams.
   *
   * @param {StepContext} context - Pipeline context with openParams (lowerBinId, upperBinId, poolAddress).
   * @returns {Promise<StepContext>} Updated context with tokenXAmount and tokenYAmount set.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    if (!context.openParams) {
      return context;
    }

    logger.info(
      `[${this.name}] Calculating optimal capital allocation for range: [${context.openParams.lowerBinId}, ${context.openParams.upperBinId}]`
    );

    // Read directly from the live position state instead of hardcoding.
    // If you pass manual overrides in the strategy params, it uses those.
    // Otherwise, it perfectly rolls over the exact amounts currently in the position.
    const tokenXAmount = (context.params.tokenXAmount as string) || context.position.tokenX.amount;
    const tokenYAmount = (context.params.tokenYAmount as string) || context.position.tokenY.amount;

    logger.info(`[${this.name}] Allocating ${tokenXAmount} base token and ${tokenYAmount} quote token (rollover).`);

    return {
      ...context,
      openParams: {
        ...context.openParams,
        tokenXAmount,
        tokenYAmount,
      },
    };
  }
}
