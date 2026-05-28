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
import { IStep, StepContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('range-calculator-step');

export class RangeCalculatorStep implements IStep {
  public name = 'RangeCalculatorStep';

  public readonly descriptor: StepDescriptor = {
    id: 'range-calculator',
    name: 'Range Calculator',
    description: 'Calculates new symmetric bin boundaries centered on the current active bound.',
    category: 'range',
    inputs: [
      { key: 'signal', type: 'string', description: 'Requires "close+open" to run' },
      { key: 'market', type: 'MarketSnapshot', description: 'Requires market.activeBound' },
    ],
    outputs: [{ key: 'openParams', type: 'OpenParams', description: 'Sets bounds in openParams' }],
    params: [{ key: 'rangePercent', type: 'number', description: 'Width of the range around active price', default: 20 }],
  };

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

    logger.info(`[${this.name}] Calculating optimal CLMM bin boundaries around active bound ${context.market.activeBound}`);

    const rangePercent = (context.params.rangePercent as number) || 20;
    // For CLMM, rangePercent maps to a set number of bins (e.g. 100 bins width)
    const binCount = Math.floor(rangePercent * 5); // Simple linear multiplier for demonstration

    let lowerBinId = context.market.activeBound - Math.floor(binCount / 2);
    let upperBinId = context.market.activeBound + Math.floor(binCount / 2);

    // Enforce the Meteora 70-bin limit (69 index difference)
    const MAX_BIN_DIFF = 69;
    if (upperBinId - lowerBinId > MAX_BIN_DIFF) {
      logger.warn(
        `[${this.name}] Requested range (${upperBinId - lowerBinId} bins) exceeds Meteora 70-bin limit. Clamping width.`
      );

      // Calculate the center point
      const midBin = Math.floor((upperBinId + lowerBinId) / 2);

      // Clamp symmetrically around the mid point
      const halfWidth = Math.floor(MAX_BIN_DIFF / 2);
      lowerBinId = midBin - halfWidth;
      upperBinId = lowerBinId + MAX_BIN_DIFF;
    }

    // Set both agnostic bounds and legacy bin IDs for compatibility
    const lowerBound = lowerBinId;
    const upperBound = upperBinId;

    logger.info(
      `[${this.name}] Calculated new range bounds: [${lowerBound}, ${upperBound}] (width: ${upperBinId - lowerBinId + 1} bins)`
    );

    return {
      ...context,
      openParams: {
        poolAddress: context.market.poolAddress,
        lowerBound,
        upperBound,
        lowerBinId,
        upperBinId,
        tokenXAmount: '0',
        tokenYAmount: '0',
      },
    };
  }
}
