/**
 * @file range-calculator-step.ts
 * @description Calculates new boundaries for rebalance open position (close+open signal).
 *
 * @features
 * - Runs only when signal === 'close+open' (out-of-range signal from TrailingRangeCheckStep)
 * - Computes symmetric range around current market.activeBound using configurable rangePercent
 * - Emits openParams with poolAddress, bounds, and bin IDs (for backward compatibility), plus placeholder amounts (filled later by AmountCalculatorStep)
 *
 * @dependencies IStep, StepContext (from @lp-system/core), rangePercent from strategy params
 * @sideEffects None — pure calculation
 */
import { IStep, StepContext } from '@lp-system/core';

/**
 * RangeCalculatorStep: computes new lower/upper boundaries for rebalance open.
 * Only executes when context.signal === 'close+open'.
 */
export class RangeCalculatorStep implements IStep {
  public name = 'RangeCalculatorStep';

  /**
   * Calculates new bin boundaries centered on the current active bound.
   *
   * @param {StepContext} context - Pipeline context with signal='close+open' and market.activeBound.
   * @returns {Promise<StepContext>} Updated context with openParams containing computed bounds.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    if (context.signal !== 'close+open') {
      return context;
    }

    console.log(`[${this.name}] Calculating optimal CLMM bin boundaries around active bound ${context.market.activeBound}`);

    const rangePercent = (context.params.rangePercent as number) || 20;
    // For CLMM, rangePercent maps to a set number of bins (e.g. 100 bins width)
    const binCount = Math.floor(rangePercent * 5); // Simple linear multiplier for demonstration

    const lowerBinId = context.market.activeBound - Math.floor(binCount / 2);
    const upperBinId = context.market.activeBound + Math.floor(binCount / 2);

    // Set both agnostic bounds and legacy bin IDs for compatibility
    const lowerBound = lowerBinId;
    const upperBound = upperBinId;

    console.log(`[${this.name}] Calculated new range bounds: [${lowerBound}, ${upperBound}] (width: ${binCount} bins)`);

    return {
      ...context,
      openParams: {
        poolAddress: context.market.poolAddress,
        lowerBound,
        upperBound,
        lowerBinId,
        upperBinId,
        tokenXAmount: '0',
        tokenYAmount: '0'
      }
    };
  }
}
