import { CalculatedPrices } from '@lp-system/core';

/**
 * Calculates the active bin ID (boundary) from the current price.
 * Formula: Price = (1 + binStep / 10000) ^ binId * 10 ^ (decimalsX - decimalsY)
 * Solving for binId:
 * binId = ln(Price / 10 ^ (decimalsX - decimalsY)) / ln(1 + binStep / 10000)
 */
export function getBinIdFromPrice(price: number, binStep: number, decimalsX: number, decimalsY: number): number {
  if (!price || price <= 0) {
    return 0; // default neutral bin ID (relative to 0)
  }
  const decimalFactor = Math.pow(10, decimalsX - decimalsY);
  const ratio = price / decimalFactor;
  const binStepFactor = 1 + binStep / 10000;
  const binOffset = Math.log(ratio) / Math.log(binStepFactor);
  return Math.round(binOffset);
}

/**
 * Calculates the price from the bin ID (boundary).
 * Formula: Price = (1 + binStep / 10000) ^ binId * 10 ^ (decimalsX - decimalsY)
 */
export function getPriceFromBinId(binId: number, binStep: number, decimalsX: number, decimalsY: number): number {
  const decimalFactor = Math.pow(10, decimalsX - decimalsY);
  const binStepFactor = 1 + binStep / 10000;
  return Math.pow(binStepFactor, binId) * decimalFactor;
}

/**
 * Calculates all three average/entry pricing perspectives for concentrated liquidity positions.
 * Supports computing Geometric Average, Spot Average, Market Maker Perspective (mid-price/convexity benefit),
 * and the actual Effective Break-even with accrued fees.
 */
export function calculateConcentratedLiquidityPrices(
  lowerBinId: number,
  upperBinId: number,
  binStep: number,
  decimalsX: number,
  decimalsY: number,
  amountXStr?: string,
  _amountYStr?: string,
  feeXStr?: string,
  feeYStr?: string
): CalculatedPrices {
  const lowerPrice = getPriceFromBinId(lowerBinId, binStep, decimalsX, decimalsY);
  const upperPrice = getPriceFromBinId(upperBinId, binStep, decimalsX, decimalsY);

  const midPrice = (lowerPrice + upperPrice) / 2;
  const geometricAverage = Math.sqrt(lowerPrice * upperPrice);
  const spotAverage = geometricAverage; // mathematically identical in zero-fee/slippage case
  const convexityBenefit = midPrice - geometricAverage;

  let effectiveBreakEven: number | undefined;

  // Compute effective break-even if token amounts are provided
  if (amountXStr !== undefined) {
    const amountX = Number(amountXStr) / Math.pow(10, decimalsX);
    const feeX = feeXStr ? Number(feeXStr) / Math.pow(10, decimalsX) : 0;
    const feeY = feeYStr ? Number(feeYStr) / Math.pow(10, decimalsY) : 0;

    // Standard concentrated liquidity: if price has gone below the range,
    // the active position holds only tokenX (e.g. SOL).
    // The implied initial capital deposited (in USDC/tokenY) is:
    // capitalY = totalX * geometricAverage
    const totalX = amountX + feeX;

    if (totalX > 0) {
      const impliedCapitalY = totalX * geometricAverage;
      effectiveBreakEven = (impliedCapitalY - feeY) / totalX;
    }
  }

  return {
    lowerPrice,
    upperPrice,
    midPrice,
    geometricAverage,
    spotAverage,
    convexityBenefit,
    ...(effectiveBreakEven !== undefined ? { effectiveBreakEven } : {}),
  };
}

/**
 * Safely parses a decimal string into a raw integer string (e.g., "2.978076" with 6 decimals -> "2978076")
 * without using floating-point math to prevent precision loss.
 *
 * @param {string} decimalStr - The decimal string to parse.
 * @param {number} decimals - Precision (decimals) of the token.
 * @returns {string} Sliced/padded string of the raw integer.
 */
export function parseDecimalToRaw(decimalStr: string, decimals: number): string {
  if (!decimalStr) return '0';
  const parts = decimalStr.split('.');
  const integerPart = parts[0] || '0';
  let fractionalPart = parts[1] || '';

  if (fractionalPart.length > decimals) {
    fractionalPart = fractionalPart.slice(0, decimals);
  } else {
    fractionalPart = fractionalPart.padEnd(decimals, '0');
  }

  const combined = `${integerPart}${fractionalPart}`.replace(/^0+/, '');
  return combined === '' ? '0' : combined;
}
