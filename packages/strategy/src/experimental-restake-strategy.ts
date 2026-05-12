import {
  IStrategy,
  Position,
  MarketSnapshot,
  StrategyResult,
  OpenParams,
} from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('experimental-restake-strategy');

function getBinIdFromPrice(
  price: number,
  binStep: number,
  decimalsX: number,
  decimalsY: number
): number {
  if (!price || price <= 0) {
    return 8388608;
  }
  const decimalFactor = Math.pow(10, decimalsY - decimalsX);
  const ratio = price / decimalFactor;
  const binStepFactor = 1 + binStep / 10000;
  const binOffset = Math.log(ratio) / Math.log(binStepFactor);
  return Math.round(8388608 + binOffset);
}

export class ExperimentalRestakeStrategy implements IStrategy {
  public id = 'experimental-restake';
  public description =
    'Experimental strategy to restake on price above range with 0.8 USDC single-direction';

  constructor(private defaultParams: Record<string, unknown> = {}) {}

  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    const mergedParams = {
      ...this.defaultParams,
      ...params,
    };

    logger.info(
      `[ExperimentalRestakeStrategy] Evaluating position: ${position.id} with params: ${JSON.stringify(mergedParams)}`
    );

    logger.info(
      `[ExperimentalRestakeStrategy] Market - Price: ${market.price}, Active Bound: ${market.activeBound}, Position range: [${position.lowerBound}, ${position.upperBound}]`
    );

    // 1. If price is above current range:
    if (market.activeBound > position.upperBound) {
      logger.info(
        `[ExperimentalRestakeStrategy] Price (${market.activeBound}) is above position upperBound (${position.upperBound}). Triggering close+open rebalance.`
      );

      // Default binStep is 100 if not available (0.01%)
      const binStep = (position.metadata?.binStep as number) || 100;
      const decimalsX = position.tokenX.decimals;
      const decimalsY = position.tokenY.decimals;

      // Price range in percent: 0 to -0.15% from active price
      // upperBound price is the active price
      // lowerBound price is active price * (1 - 0.0015)
      const upperBoundPrice = market.price;
      const lowerBoundPrice = market.price * (1 - 0.0015);

      const upperBinId = getBinIdFromPrice(upperBoundPrice, binStep, decimalsX, decimalsY);
      const lowerBinId = getBinIdFromPrice(lowerBoundPrice, binStep, decimalsX, decimalsY);

      // Amount: restake 0.8 USDC (micro-units based on decimalsY)
      const usdcAmount = (0.8 * Math.pow(10, decimalsY)).toFixed(0);

      const openParams: OpenParams = {
        poolAddress: position.poolAddress,
        lowerBound: lowerBinId,
        upperBound: upperBinId,
        lowerBinId,
        upperBinId,
        tokenXAmount: '0', // single direction usdc only
        tokenYAmount: usdcAmount,
      };

      logger.info(
        `[ExperimentalRestakeStrategy] Computed rebalance parameters: ` +
          `LowerBin: ${lowerBinId} (Price: ${lowerBoundPrice.toFixed(6)}), ` +
          `UpperBin: ${upperBinId} (Price: ${upperBoundPrice.toFixed(6)}), ` +
          `Amounts - Token X: 0, Token Y: ${usdcAmount}`
      );

      return {
        action: 'close+open',
        openParams,
      };
    }

    // 2. If price is lower than range:
    if (market.activeBound < position.lowerBound) {
      logger.info(
        `[ExperimentalRestakeStrategy] SKIP evaluation. Reason: Price (${market.activeBound}) is below position lowerBound (${position.lowerBound}). Skipping for now.`
      );
      return {
        action: 'skip',
      };
    }

    // Else:
    logger.info(
      `[ExperimentalRestakeStrategy] SKIP evaluation. Reason: Price is within position bounds.`
    );
    return {
      action: 'skip',
    };
  }
}
