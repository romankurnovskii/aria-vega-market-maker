/**
 * @file amount-calculator-step.ts
 * @description Final step: determines token amounts for new position during rebalance.
 *
 * @features
 * - Runs only when openParams already exist (after RangeCalculatorStep)
 * - Fills tokenXAmount and tokenYAmount from strategy params (tokenXAmount, tokenYAmount) or defaults
 * - Propagates existing openParams fields unchanged except amounts
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure calculation
 */
import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('amount-calculator-step');

export class AmountCalculatorStep implements IStep {
  public name = 'AmountCalculatorStep';

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

    // Fetch allocation params from strategy config or fallback to defaults
    const tokenXAmount = (context.params.tokenXAmount as string) || '1000000000'; // e.g., 1.0 SOL
    const tokenYAmount = (context.params.tokenYAmount as string) || '150000000'; // e.g., 150 USDC

    logger.info(
      `[${this.name}] Allocating ${tokenXAmount} base token and ${tokenYAmount} quote token to the new position.`
    );

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
