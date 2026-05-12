import test from 'node:test';
import assert from 'node:assert';
import { getPriceFromBinId, getBinIdFromPrice, calculateConcentratedLiquidityPrices } from './meteora.utils';

test('getPriceFromBinId accurately calculates prices from bin IDs', () => {
  const binStep = 40;
  const decimalsX = 9;
  const decimalsY = 6;

  // Test standard bin mapping
  const price1 = getPriceFromBinId(-577, binStep, decimalsX, decimalsY);
  assert.ok(Math.abs(price1 - 99.9189) < 0.01);

  const price2 = getPriceFromBinId(-531, binStep, decimalsX, decimalsY);
  assert.ok(Math.abs(price2 - 120.06) < 0.01);
});

test('getBinIdFromPrice accurately calculates bin IDs from prices', () => {
  const binStep = 40;
  const decimalsX = 9;
  const decimalsY = 6;

  const binId1 = getBinIdFromPrice(100, binStep, decimalsX, decimalsY);
  assert.strictEqual(binId1, -577);

  const binId2 = getBinIdFromPrice(120, binStep, decimalsX, decimalsY);
  assert.strictEqual(binId2, -531);

  // Guard rails
  assert.strictEqual(getBinIdFromPrice(0, binStep, decimalsX, decimalsY), 0);
  assert.strictEqual(getBinIdFromPrice(-10, binStep, decimalsX, decimalsY), 0);
});

test('calculateConcentratedLiquidityPrices returns correct geometric and mid prices', () => {
  const binStep = 40;
  const decimalsX = 9;
  const decimalsY = 6;

  // Range 100 to 120 (mapped to nearest bin ids: -577 and -531)
  const result = calculateConcentratedLiquidityPrices(-577, -531, binStep, decimalsX, decimalsY);

  assert.ok(Math.abs(result.lowerPrice - 99.9189) < 0.01);
  assert.ok(Math.abs(result.upperPrice - 120.06) < 0.01);
  assert.ok(Math.abs(result.midPrice - 109.9895) < 0.01);
  assert.ok(Math.abs(result.geometricAverage - 109.5275) < 0.01);
  assert.ok(Math.abs(result.spotAverage - 109.5275) < 0.01);
  assert.ok(Math.abs(result.convexityBenefit - 0.462) < 0.01);
  assert.strictEqual(result.effectiveBreakEven, undefined);
});

test('calculateConcentratedLiquidityPrices correctly computes effective break-even with accrued fees', () => {
  const binStep = 40;
  const decimalsX = 9;
  const decimalsY = 6;

  // Range 100 to 120 with 10 SOL, 0 USDC, 0 feeX, 1.50 USDC feeY
  const result = calculateConcentratedLiquidityPrices(
    -577,
    -531,
    binStep,
    decimalsX,
    decimalsY,
    '10000000000', // 10 SOL (9 decimals)
    '0',
    '0',
    '1500000' // 1.50 USDC (6 decimals)
  );

  assert.ok(Math.abs(result.geometricAverage - 109.5275) < 0.01);
  // Break-even is lower because accrued fees are deducted from cost basis
  // Expected: (10 * 109.5275 - 1.50) / 10 = 109.3775
  assert.ok(Math.abs((result.effectiveBreakEven || 0) - 109.3775) < 0.01);
});

test('calculateConcentratedLiquidityPrices handles edge cases gracefully', () => {
  const binStep = 40;
  const decimalsX = 9;
  const decimalsY = 6;

  // Empty values/defaults
  const result = calculateConcentratedLiquidityPrices(
    -577,
    -531,
    binStep,
    decimalsX,
    decimalsY,
    '0', // amountX is 0
    '0',
    '0',
    '1500000'
  );

  assert.strictEqual(result.effectiveBreakEven, undefined);
});
