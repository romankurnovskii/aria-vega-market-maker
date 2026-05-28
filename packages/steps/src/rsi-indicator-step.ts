/**
 * @file rsi-indicator-step.ts
 * @description Computes the Relative Strength Index (RSI) from the market's price history.
 *
 * @features
 * - Reads market.priceHistory for closing prices
 * - Computes standard RSI using the Wilder smoothing method
 * - Writes `rsi: number` (0–100) to the pipeline context
 * - Configurable `period` parameter (default: 14)
 *
 * @dependencies IStep, PipelineContext, StepDescriptor (from @lp-system/core)
 * @sideEffects None — pure computation
 */
import { IStep, PipelineContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('rsi-indicator-step');

export interface RsiParams {
  period: number;
  outputKey?: string;
}

const DEFAULT_PARAMS: RsiParams = {
  period: 14,
  outputKey: 'rsi',
};

export class RsiIndicatorStep implements IStep {
  public name = 'RsiIndicatorStep';

  public readonly descriptor: StepDescriptor = {
    id: 'rsi-indicator',
    name: 'RSI Indicator',
    description:
      'Computes the Relative Strength Index (RSI) from price history. RSI < 30 typically indicates oversold; RSI > 70 indicates overbought.',
    category: 'indicator',
    inputs: [{ key: 'market', type: 'MarketSnapshot', description: 'Market data with priceHistory array', required: true }],
    outputs: [
      { key: 'rsi', type: 'number', description: 'RSI value (0–100)' },
      { key: 'rsiPeriod', type: 'number', description: 'Period used for calculation' },
    ],
    params: [
      { key: 'period', type: 'number', description: 'Lookback period for RSI calculation', default: 14, min: 2, max: 50 },
      { key: 'outputKey', type: 'string', description: 'Custom context key to write the RSI value to', default: 'rsi' },
    ],
  };

  private params: RsiParams;

  constructor(params: Partial<RsiParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Computes RSI from the market's price history using the Wilder smoothing method.
   *
   * @param {PipelineContext} context - Pipeline context with market data.
   * @returns {Promise<PipelineContext>} Updated context with dynamic RSI and RSI period fields.
   */
  public async execute(context: PipelineContext): Promise<PipelineContext> {
    const { period, outputKey } = this.params;
    const key = outputKey || 'rsi';
    const periodKey = `${key}Period`;
    const prices = (context.market.priceHistory || []).map((p) => p.price);

    if (prices.length < period + 1) {
      logger.warn(
        `[${this.name}] Insufficient price history for RSI(${period}): have ${prices.length} candles, need ${period + 1}. Setting RSI to 50 (neutral).`
      );
      return {
        ...context,
        [key]: 50,
        [periodKey]: period,
      };
    }

    const rsi = this.computeRsi(prices, period);
    logger.info(`[${this.name}] RSI(${period}) = ${rsi.toFixed(2)} (from ${prices.length} candles) stored in "${key}"`);

    return {
      ...context,
      [key]: rsi,
      [periodKey]: period,
    };
  }

  /**
   * Computes RSI using the Wilder exponential moving average method.
   *
   * @param {number[]} prices - Array of closing prices, oldest first.
   * @param {number} period - RSI lookback period.
   * @returns {number} RSI value between 0 and 100.
   */
  private computeRsi(prices: number[], period: number): number {
    // Calculate price changes
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    // Initial average gain and loss (simple average of first `period` changes)
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) avgGain += changes[i];
      else avgLoss += Math.abs(changes[i]);
    }
    avgGain /= period;
    avgLoss /= period;

    // Wilder smoothing for remaining changes
    for (let i = period; i < changes.length; i++) {
      const gain = changes[i] > 0 ? changes[i] : 0;
      const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }
}
