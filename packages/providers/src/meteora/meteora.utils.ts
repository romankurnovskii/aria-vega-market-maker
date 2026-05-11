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

