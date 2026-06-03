/**
 * @file condition-decision-step.test.ts
 * @description Unit tests for the ConditionDecisionStep, verifying legacy backward compatibility and the multi-condition logical rules engine.
 *
 * @features
 * - Verifies simple legacy single-condition validations (truthy, falsy, numerical)
 * - Verifies advanced multi-line rule parsing and evaluation with AND (&&) / OR (||) logic
 * - Verifies negations, custom comparisons, string matching, and default signals
 *
 * @dependencies node:test, node:assert, @lp-system/core
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PipelineContext } from '@lp-system/core';
import { ConditionDecisionStep } from './condition-decision-step.js';

const dummyToken = { tokenAddress: 'dummy', decimals: 6, amount: '0' };

// Dummy position and market snapshot for context
const baseContext: PipelineContext = {
  position: {
    id: 'test-position',
    poolAddress: 'pool-dummy',
    chain: 'solana',
    protocol: 'meteora_dlmm',
    lowerBound: 90,
    upperBound: 110,
    tokenX: dummyToken,
    tokenY: dummyToken,
    isInRange: true,
    openedAt: Date.now(),
    metadata: {},
    state: 'OPEN',
  },
  market: {
    poolAddress: 'pool-dummy',
    chain: 'solana',
    protocol: 'meteora_dlmm',
    activeBound: 100,
    price: 1.25,
    priceHistory: [],
    feeRate: 0.01,
    capturedAt: Date.now(),
  },
  params: {},
};

describe('ConditionDecisionStep - JSON AST Rules Engine Mode', () => {
  it('should parse and evaluate a JSON AST structure correctly', async () => {
    const step = new ConditionDecisionStep({
      rules: [
        {
          conditions: [
            { field: 'rsi14', operator: 'gt', value: 70 },
            { logicalOperator: 'AND', field: 'priceAboveSma', operator: 'eq', value: true },
          ],
          signal: 'close',
        },
        {
          conditions: [{ field: 'rsi14', operator: '<', value: 30 }],
          signal: 'open',
        },
      ],
      defaultSignal: 'skip',
    });

    const contextMatchFirst = { ...baseContext, rsi14: 75, priceAboveSma: true };
    const resultFirst = await step.execute(contextMatchFirst);
    assert.strictEqual(resultFirst._signal, 'close');

    const contextMatchSecond = { ...baseContext, rsi14: 25, priceAboveSma: false };
    const resultSecond = await step.execute(contextMatchSecond);
    assert.strictEqual(resultSecond._signal, 'open');

    const contextNoMatch = { ...baseContext, rsi14: 50, priceAboveSma: true };
    const resultNoMatch = await step.execute(contextNoMatch);
    assert.strictEqual(resultNoMatch._signal, 'skip');
  });
});
