import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';
import { getBinIdFromPrice, calculateConcentratedLiquidityPrices } from '@lp-system/providers';

const logger = getLogger('experimental-restake-step');

export class ExperimentalRestakeStep implements IStep {
  public name = 'ExperimentalRestakeStep';

  /**
   * Evaluates the restake rule for the position and market context.
   *
   * @param {StepContext} context - Pipeline context containing position, market, and parameters.
   * @returns {Promise<StepContext>} Updated context with signal, reason, and openParams if a rebalance is needed.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Evaluating position ${context.position.id}. Active bound: ${context.market.activeBound}`);

    // Calculate concentrated liquidity entry prices if missing
    const binStep = (context.position.metadata?.binStep as number) || (context.params.binStep as number) || 4;
    const decimalsX = context.position.tokenX.decimals;
    const decimalsY = context.position.tokenY.decimals;

    let calculations = context.calculations;
    if (!calculations) {
      const amountXStr = context.position.tokenX.amount;
      const amountYStr = context.position.tokenY.amount;
      const feeXStr = context.position.metadata?.feeX as string | undefined;
      const feeYStr = context.position.metadata?.feeY as string | undefined;

      calculations = calculateConcentratedLiquidityPrices(
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
      context.calculations = calculations;
    }

    if (context.signal) {
      return context;
    }

    // 1. If price is above current range:
    if (context.market.activeBound > context.position.upperBound) {
      logger.info(
        `[${this.name}] Price (${context.market.activeBound}) is above position upperBound (${context.position.upperBound}). Triggering close+open rebalance.`
      );

      // Price range in percent: 0 to -0.15% from active price
      const upperBoundPrice = context.market.price;
      const lowerBoundPrice = context.market.price * (1 - 0.0015);

      const upperBinId = getBinIdFromPrice(upperBoundPrice, binStep, decimalsX, decimalsY);
      const lowerBinId = getBinIdFromPrice(lowerBoundPrice, binStep, decimalsX, decimalsY);

      // Amount: get from parameters or default to position's current tokenY.amount
      let usdcAmount: string;
      if (context.params.restakeAmount !== undefined) {
        const amountNum = Number(context.params.restakeAmount);
        usdcAmount = BigInt(Math.round(amountNum * Math.pow(10, decimalsY))).toString();
        logger.info(
          `[${this.name}] Using configured restakeAmount from parameters: ${amountNum} USDC (${usdcAmount} micro-units)`
        );
      } else {
        usdcAmount = context.position.tokenY.amount;
        logger.info(
          `[${this.name}] restakeAmount parameter not set. Defaulting to position's current tokenY amount: ${usdcAmount}`
        );
      }

      const openParams = {
        poolAddress: context.position.poolAddress,
        lowerBound: lowerBinId,
        upperBound: upperBinId,
        lowerBinId,
        upperBinId,
        tokenXAmount: '0', // single direction USDC only
        tokenYAmount: usdcAmount,
      };

      logger.info(
        `[${this.name}] Computed rebalance parameters: ` +
          `LowerBin: ${lowerBinId} (Price: ${lowerBoundPrice.toFixed(6)}), ` +
          `UpperBin: ${upperBinId} (Price: ${upperBoundPrice.toFixed(6)}), ` +
          `Amounts - Token X: 0, Token Y: ${usdcAmount}`
      );

      return {
        ...context,
        signal: 'close+open',
        reason: `Active bound ${context.market.activeBound} shifted out of range [${context.position.lowerBound}, ${context.position.upperBound}]`,
        openParams,
      };
    }

    // 2. If price is lower than range:
    if (context.market.activeBound < context.position.lowerBound) {
      logger.info(
        `[${this.name}] Price (${context.market.activeBound}) is below position lowerBound (${context.position.lowerBound}). Triggering down-range restake rebalance.`
      );

      // Determine the average spot buy price (prefer effective break-even with accrued fees, otherwise geometric average)
      const avgSpotBuy = calculations.effectiveBreakEven || calculations.geometricAverage;
      const lowerBoundPrice = context.market.price;

      // Calculate wider range upper bound so that the geometric average spot sell price matches average spot buy price
      // Math.sqrt(lowerBoundPrice * upperBoundPrice) = avgSpotBuy => upperBoundPrice = (avgSpotBuy ^ 2) / lowerBoundPrice
      const upperBoundPrice = (avgSpotBuy * avgSpotBuy) / lowerBoundPrice;

      logger.info(
        `[${this.name}] Average spot buy price of position: ${avgSpotBuy.toFixed(6)}, market/lower bound price: ${lowerBoundPrice.toFixed(6)}. ` +
          `Computed target upper bound price to maintain break-even spot sell: ${upperBoundPrice.toFixed(6)}`
      );

      let upperBinId = getBinIdFromPrice(upperBoundPrice, binStep, decimalsX, decimalsY);
      const lowerBinId = getBinIdFromPrice(lowerBoundPrice, binStep, decimalsX, decimalsY);

      // Cap dynamic range to 69 bins to ensure the position fits within Solana's 10,240-byte CPI reallocation limit
      if (upperBinId - lowerBinId > 69) {
        logger.warn(
          `[${this.name}] Calculated bin range (${upperBinId - lowerBinId} bins) exceeds Solana single-instruction reallocation limit (70 bins). Capping upperBinId to ${lowerBinId + 69}.`
        );
        upperBinId = lowerBinId + 69;
      }

      // Amount: get from parameters or default to position's current tokenX.amount
      let solAmount: string;
      if (context.params.restakeAmountSol !== undefined) {
        const amountNum = Number(context.params.restakeAmountSol);
        solAmount = BigInt(Math.round(amountNum * Math.pow(10, decimalsX))).toString();
        logger.info(`[${this.name}] Using configured restakeAmountSol from parameters: ${amountNum} SOL`);
      } else {
        const rawAmount = BigInt(context.position.tokenX.amount);
        solAmount = rawAmount.toString();
      }

      const openParams = {
        poolAddress: context.position.poolAddress,
        lowerBound: lowerBinId,
        upperBound: upperBinId,
        lowerBinId,
        upperBinId,
        tokenXAmount: solAmount,
        tokenYAmount: '0', // single direction base token only
      };

      logger.info(
        `[${this.name}] Computed down-range rebalance parameters: ` +
          `LowerBin: ${lowerBinId} (Price: ${lowerBoundPrice.toFixed(6)}), ` +
          `UpperBin: ${upperBinId} (Price: ${upperBoundPrice.toFixed(6)}), ` +
          `Amounts - Token X: ${solAmount}, Token Y: 0`
      );

      return {
        ...context,
        signal: 'close+open',
        reason: `Active bound ${context.market.activeBound} shifted below range [${context.position.lowerBound}, ${context.position.upperBound}]. Rolling SOL single-sided to average buy price.`,
        openParams,
      };
    }

    // Else:
    logger.info(`[${this.name}] SKIP evaluation. Reason: Price is within position bounds.`);
    return {
      ...context,
      signal: 'skip',
      reason: 'Price is within position bounds',
    };
  }
}
