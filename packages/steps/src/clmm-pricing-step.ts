/**
 * @file clmm-pricing-step.ts
 * @description Pipeline step that calculates CLMM average entry, spot accounting, and break-even pricing.
 *
 * @features
 * - Solves discrete CLMM tick bin IDs to nominal token prices
 * - Computes Geometric Mean, Spot accounting average, and Bid-Ask/Convexity benefits
 * - Factors in real-world accrued fee metadata to compute the Effective Break-even
 * - Generates a premium, structured console visualization card on every tick evaluation
 *
 * @dependencies IStep, StepContext (from @lp-system/core), calculateConcentratedLiquidityPrices (from @lp-system/providers)
 * @sideEffects Logs formatted card to terminal; populates context.calculations
 */
import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { calculateConcentratedLiquidityPrices } from '@lp-system/providers';

const logger = getLogger('clmm-pricing-step');

export class ClmmPricingStep implements IStep {
  public name = 'ClmmPricingStep';

  /**
   * Performs price and entry calculations, logs the premium card, and saves results to context.
   *
   * @param {StepContext} context - Pipeline context.
   * @returns {Promise<StepContext>} Updated context with computations stored in context.calculations.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    const binStep = (context.position.metadata?.binStep as number) || (context.params.binStep as number) || 4;
    const decimalsX = context.position.tokenX.decimals;
    const decimalsY = context.position.tokenY.decimals;

    const amountXStr = context.position.tokenX.amount;
    const amountYStr = context.position.tokenY.amount;
    const feeXStr = context.position.metadata?.feeX as string | undefined;
    const feeYStr = context.position.metadata?.feeY as string | undefined;

    const calculations = calculateConcentratedLiquidityPrices(
      context.position.lowerBound,
      context.position.upperBound,
      binStep,
      decimalsX,
      decimalsY,
      amountXStr,
      amountYStr,
      feeXStr,
      feeYStr
    );

    // Save calculations to context for downstream steps
    context.calculations = calculations;

    // Premium, structured console visualization of the pricing metrics
    logger.info(
      `\n┌────────────────────────────────────────────────────────┐\n` +
        `│ 🚀 CLMM POSITION PRICING METRICS                       │\n` +
        `├────────────────────────────────────────────────────────┤\n` +
        `│ Position ID:      ${context.position.id.padEnd(36)} │\n` +
        `│ Range Bounds:     Bin ${String(context.position.lowerBound).padEnd(6)} to Bin ${String(context.position.upperBound).padEnd(6)}           │\n` +
        `│ Lower Price:      ${calculations.lowerPrice.toFixed(4).padEnd(10)} USDC/SOL                 │\n` +
        `│ Upper Price:      ${calculations.upperPrice.toFixed(4).padEnd(10)} USDC/SOL                 │\n` +
        `│ Mid Price:        ${calculations.midPrice.toFixed(4).padEnd(10)} USDC/SOL                 │\n` +
        `├────────────────────────────────────────────────────────┤\n` +
        `│ 📊 AVERAGE ENTRY PRICE CALCULATIONS                    │\n` +
        `├────────────────────────────────────────────────────────┤\n` +
        `│ 1. Geometric Average: ${calculations.geometricAverage.toFixed(4).padEnd(10)} USDC/SOL        │\n` +
        `│    (Mathematical space center for Uniswap v3/Meteora) │\n` +
        `│ 2. Spot Accounting:   ${calculations.spotAverage.toFixed(4).padEnd(10)} USDC/SOL        │\n` +
        `│    (Total cost basis divided by total base assets)    │\n` +
        `│ 3. Bid-Ask perspective:                                │\n` +
        `│    Convexity Benefit: ${calculations.convexityBenefit.toFixed(4).padEnd(10)} USDC             │\n` +
        `│    (Benefit of range vs single limit order at mid)     │\n` +
        `│ 4. Effective Break-even:                               │\n` +
        `│    With Accrued Fees: ${calculations.effectiveBreakEven !== undefined ? calculations.effectiveBreakEven.toFixed(4).padEnd(10) : 'N/A'.padEnd(10)} USDC/SOL        │\n` +
        `└────────────────────────────────────────────────────────┘`
    );

    return context;
  }
}
