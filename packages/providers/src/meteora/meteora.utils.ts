/**
 * Calculates the active bin ID (boundary) from the current price.
 * Formula: Price = (1 + binStep / 10000) ^ (binId - 8388608) * 10 ^ (decimalsY - decimalsX)
 * Solving for binId:
 * binId = 8388608 + ln(Price / 10 ^ (decimalsY - decimalsX)) / ln(1 + binStep / 10000)
 */
export function getBinIdFromPrice(
  price: number,
  binStep: number,
  decimalsX: number,
  decimalsY: number
): number {
  if (!price || price <= 0) {
    return 8388608; // default neutral bin ID
  }
  const decimalFactor = Math.pow(10, decimalsY - decimalsX);
  const ratio = price / decimalFactor;
  const binStepFactor = 1 + binStep / 10000;
  const binOffset = Math.log(ratio) / Math.log(binStepFactor);
  return Math.round(8388608 + binOffset);
}
