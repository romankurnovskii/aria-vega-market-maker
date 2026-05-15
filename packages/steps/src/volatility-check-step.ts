/**
 * @file volatility-check-step.ts
 * @description Volatility check step: evaluates price volatility and blocks rebalancing if it's too high.
 *
 * @features
 * - Calculates standard deviation of price history
 * - Compares volatility against maxVolatility threshold
 * - If volatility exceeds threshold, sets signal to 'skip' to avoid rebalancing during high volatility
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None
 */
import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('volatility-check-step');

export class VolatilityCheckStep implements IStep {
  public name = 'VolatilityCheckStep';

  /**
   * Executes volatility check.
   *
   * @param {StepContext} context - Pipeline context.
   * @returns {Promise<StepContext>}
   */
  public async execute(context: StepContext): Promise<StepContext> {
    const maxVolatility = (context.params.maxVolatility as number) || 0.05; // Default 5% volatility threshold
    const priceHistory = context.market.priceHistory || [];

    if (priceHistory.length < 2) {
      logger.info(`[${this.name}] Insufficient price history to calculate volatility. Proceeding.`);
      return context;
    }

    const prices = priceHistory.map((p) => p.price);
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const volatility = stdDev / mean;

    logger.info(
      `[${this.name}] Calculated volatility: ${(volatility * 100).toFixed(4)}%. Threshold: ${(maxVolatility * 100).toFixed(4)}%`
    );

    if (volatility > maxVolatility) {
      logger.warn(`[${this.name}] Volatility (${(volatility * 100).toFixed(2)}%) exceeds threshold. Blocking rebalance.`);
      return {
        ...context,
        signal: 'skip',
        reason: `Volatility too high: ${(volatility * 100).toFixed(2)}% > ${(maxVolatility * 100).toFixed(2)}%`,
      };
    }

    return context;
  }
}
