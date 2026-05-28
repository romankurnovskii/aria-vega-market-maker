/**
 * @file sma-indicator-step.ts
 * @description Computes the Simple Moving Average (SMA) from the market's price history.
 *
 * @features
 * - Reads market.priceHistory for closing prices
 * - Computes SMA over a configurable period
 * - Writes `sma: number` and `priceAboveSma: boolean` to the pipeline context
 *
 * @dependencies IStep, PipelineContext, StepDescriptor (from @lp-system/core)
 * @sideEffects None — pure computation
 */
import { IStep, PipelineContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('sma-indicator-step');

export interface SmaParams {
  period: number;
  outputKey?: string;
}

const DEFAULT_PARAMS: SmaParams = {
  period: 20,
  outputKey: 'sma',
};

export class SmaIndicatorStep implements IStep {
  public name = 'SmaIndicatorStep';

  public readonly descriptor: StepDescriptor = {
    id: 'sma-indicator',
    name: 'SMA Indicator',
    description:
      'Computes the Simple Moving Average (SMA) from price history and whether the current price is above or below it.',
    category: 'indicator',
    inputs: [{ key: 'market', type: 'MarketSnapshot', description: 'Market data with priceHistory array', required: true }],
    outputs: [
      { key: 'sma', type: 'number', description: 'Simple Moving Average value' },
      { key: 'priceAboveSma', type: 'boolean', description: 'Whether current price is above the SMA' },
      { key: 'smaPeriod', type: 'number', description: 'Period used for calculation' },
    ],
    params: [
      { key: 'period', type: 'number', description: 'Number of candles to average', default: 20, min: 2, max: 200 },
      { key: 'outputKey', type: 'string', description: 'Custom context key to write the SMA value to', default: 'sma' },
    ],
  };

  private params: SmaParams;

  constructor(params: Partial<SmaParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Computes Simple Moving Average from the market's price history.
   *
   * @param {PipelineContext} context - Pipeline context with market data.
   * @returns {Promise<PipelineContext>} Updated context with dynamic SMA, above indicator, and period.
   */
  public async execute(context: PipelineContext): Promise<PipelineContext> {
    const { period, outputKey } = this.params;
    const key = outputKey || 'sma';
    const aboveKey = `priceAbove${key.charAt(0).toUpperCase() + key.slice(1)}`;
    const periodKey = `${key}Period`;
    const prices = (context.market.priceHistory || []).map((p) => p.price);

    if (prices.length < period) {
      logger.warn(
        `[${this.name}] Insufficient price history for SMA(${period}): have ${prices.length} candles, need ${period}. Using current price as SMA.`
      );
      return {
        ...context,
        [key]: context.market.price,
        [aboveKey]: true,
        [periodKey]: period,
      };
    }

    // Take the last `period` prices and compute the average
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, p) => sum + p, 0) / period;
    const priceAboveSma = context.market.price > sma;

    logger.info(
      `[${this.name}] SMA(${period}) = ${sma.toFixed(4)}, price = ${context.market.price.toFixed(4)}, above = ${priceAboveSma} stored in "${key}"`
    );

    return {
      ...context,
      [key]: sma,
      [aboveKey]: priceAboveSma,
      [periodKey]: period,
    };
  }
}
