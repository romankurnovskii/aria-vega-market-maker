/**
 * @file favorable-range-check-step.ts
 * @description Evaluates whether current market conditions favor deploying a wider liquidity range.
 *
 * @features
 * - Analyzes price volatility, trend stability, and fee sustainability
 * - Emits 'skip' when conditions favor wider range (position can remain wider)
 * - Emits 'close+open' signal to trigger rebalancing to wider range when conditions are favorable
 * - Respects prior signals: if a previous step already set a signal, this step passes through
 *
 * @dependencies IStep, StepContext, CalculatedPrices (from @lp-system/core)
 * @sideEffects None — pure check, no mutations beyond signal/reason in context
 */
import { IStep, StepContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('favorable-range-check-step');

export interface FavorableRangeParams {
  volatilityThreshold: number;
  minTrendLength: number;
  feeRateMinBps: number;
  priceStabilityWindow: number;
}

const DEFAULT_PARAMS: FavorableRangeParams = {
  volatilityThreshold: 0.02,
  minTrendLength: 3,
  feeRateMinBps: 30,
  priceStabilityWindow: 0.01,
};

export class FavorableRangeCheckStep implements IStep {
  public name = 'FavorableRangeCheckStep';

  public readonly descriptor: StepDescriptor = {
    id: 'favorable-range-check',
    name: 'Favorable Range Check',
    description: 'Evaluates if market conditions favor deploying a wider liquidity range.',
    category: 'analysis',
    inputs: [
      { key: 'market', type: 'MarketSnapshot', description: 'Market data including price history and fee rate' },
      { key: 'signal', type: 'string', description: 'Prior signal (if any)', required: false },
    ],
    outputs: [
      { key: 'signal', type: 'string', description: 'Set to "close+open" or "skip"' },
      { key: 'reason', type: 'string', description: 'Explanation' },
    ],
    params: [
      { key: 'volatilityThreshold', type: 'number', description: 'Max coefficient of variation' },
      { key: 'minTrendLength', type: 'number', description: 'Minimum data points for trend check' },
      { key: 'feeRateMinBps', type: 'number', description: 'Minimum fee rate in bps' },
      { key: 'priceStabilityWindow', type: 'number', description: 'Maximum price change ratio' },
    ],
  };

  private params: FavorableRangeParams;

  constructor(params: Partial<FavorableRangeParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  /**
   * Evaluates market conditions for wider range suitability.
   *
   * Favorable conditions for wider range:
   * 1. Low price volatility (price swings are moderate)
   * 2. Stable or consistent price trend
   * 3. Sufficient fee rate to sustain wider range
   * 4. Price remaining within stability window
   *
   * @param {StepContext} context - Pipeline context with position, market, and calculations.
   * @returns {Promise<StepContext>} Updated context with signal and reason if conditions favor wider range.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Evaluating market conditions for wider range`);

    if (context.signal) {
      logger.info(`[${this.name}] Prior signal '${context.signal}' already set, skipping.`);
      return context;
    }

    const { market } = context;
    const priceHistory = market.priceHistory ?? [];

    const isLowVolatility = this.checkVolatility(priceHistory);
    const isStableTrend = this.checkTrendStability(priceHistory);
    const isSufficientFee = this.checkFeeRate(market.feeRate);
    const isPriceStable = this.checkPriceStability(priceHistory, market.price);

    const conditions = {
      isLowVolatility,
      isStableTrend,
      isSufficientFee,
      isPriceStable,
    };

    logger.info(
      `[${this.name}] Condition analysis: volatility=${isLowVolatility}, trend=${isStableTrend}, fee=${isSufficientFee}, priceStable=${isPriceStable}`
    );

    const favorableCount = Object.values(conditions).filter(Boolean).length;

    if (favorableCount >= 3) {
      logger.info(
        `[${this.name}] Market conditions FAVORABLE for wider range (${favorableCount}/4 conditions met). Triggering close+open rebalance.`
      );
      return {
        ...context,
        signal: 'close+open',
        reason: `Favorable market conditions for wider range: ${favorableCount}/4 criteria met (volatility=${isLowVolatility}, trend=${isStableTrend}, fee=${isSufficientFee}, priceStable=${isPriceStable})`,
      };
    }

    logger.info(
      `[${this.name}] Market conditions NOT yet favorable for wider range (${favorableCount}/4 conditions met). Skipping.`
    );
    return {
      ...context,
      signal: 'skip',
      reason: `Market conditions not yet favorable for wider range: ${favorableCount}/4 criteria met`,
    };
  }

  private checkVolatility(priceHistory: { price: number; timestamp: number }[]): boolean {
    if (priceHistory.length < 2) {
      return true;
    }

    const prices = priceHistory.map((p) => p.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    const isLowVolatility = coefficientOfVariation < this.params.volatilityThreshold;
    logger.debug(
      `[${this.name}] Volatility check: CV=${coefficientOfVariation.toFixed(4)}, threshold=${this.params.volatilityThreshold}, result=${isLowVolatility}`
    );
    return isLowVolatility;
  }

  private checkTrendStability(priceHistory: { price: number; timestamp: number }[]): boolean {
    if (priceHistory.length < this.params.minTrendLength) {
      return true;
    }

    const recentPrices = priceHistory.slice(-this.params.minTrendLength).map((p) => p.price);
    const ascendingCount = recentPrices.filter((_, i) => i > 0 && recentPrices[i] > recentPrices[i - 1]).length;
    const descendingCount = recentPrices.filter((_, i) => i > 0 && recentPrices[i] < recentPrices[i - 1]).length;

    const stabilityRatio = Math.max(ascendingCount, descendingCount) / (recentPrices.length - 1);
    const isStableTrend = stabilityRatio > 0.5;

    logger.debug(
      `[${this.name}] Trend stability: asc=${ascendingCount}, desc=${descendingCount}, ratio=${stabilityRatio.toFixed(2)}, result=${isStableTrend}`
    );
    return isStableTrend;
  }

  private checkFeeRate(feeRate: number): boolean {
    const feeRateBps = feeRate * 10000;
    const isSufficient = feeRateBps >= this.params.feeRateMinBps;
    logger.debug(
      `[${this.name}] Fee rate check: ${feeRateBps.toFixed(0)} bps, minimum=${this.params.feeRateMinBps} bps, result=${isSufficient}`
    );
    return isSufficient;
  }

  private checkPriceStability(priceHistory: { price: number; timestamp: number }[], currentPrice: number): boolean {
    if (priceHistory.length === 0) {
      return true;
    }

    const oldestPrice = priceHistory[0].price;
    const priceChange = Math.abs((currentPrice - oldestPrice) / oldestPrice);
    const isStable = priceChange < this.params.priceStabilityWindow;

    logger.debug(
      `[${this.name}] Price stability: change=${priceChange.toFixed(4)}, window=${this.params.priceStabilityWindow}, result=${isStable}`
    );
    return isStable;
  }
}
