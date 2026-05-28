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

describe('ConditionDecisionStep - Legacy Mode', () => {
  it('should evaluate legacy truthy comparison correctly', async () => {
    const step = new ConditionDecisionStep({
      field: 'priceAboveSma',
      operator: 'truthy',
      signalOnTrue: 'open',
      signalOnFalse: 'skip',
    });

    const contextWithTrue = { ...baseContext, priceAboveSma: true };
    const resultTrue = await step.execute(contextWithTrue);
    assert.strictEqual(resultTrue._signal, 'open');
    assert.match(resultTrue._reason || '', /TRUE/);

    const contextWithFalse = { ...baseContext, priceAboveSma: false };
    const resultFalse = await step.execute(contextWithFalse);
    assert.strictEqual(resultFalse._signal, 'skip');
    assert.match(resultFalse._reason || '', /FALSE/);
  });

  it('should evaluate legacy gt operator correctly', async () => {
    const step = new ConditionDecisionStep({
      field: 'rsi',
      operator: 'gt',
      threshold: 70,
      signalOnTrue: 'close',
      signalOnFalse: 'skip',
    });

    const contextHigh = { ...baseContext, rsi: 75 };
    const resultHigh = await step.execute(contextHigh);
    assert.strictEqual(resultHigh._signal, 'close');

    const contextLow = { ...baseContext, rsi: 35 };
    const resultLow = await step.execute(contextLow);
    assert.strictEqual(resultLow._signal, 'skip');
  });

  it('should handle missing field gracefully in legacy mode', async () => {
    const step = new ConditionDecisionStep({});
    const result = await step.execute(baseContext);
    assert.strictEqual(result._signal, 'skip');
    assert.match(result._reason || '', /no rules or field configured/);
  });
});

describe('ConditionDecisionStep - Rules Engine Mode', () => {
  it('should match fallback/default signal when no rules match', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsi14 > 70 -> close\nrsi14 < 30 -> open',
      defaultSignal: 'skip',
    });

    const contextNeutral = { ...baseContext, rsi14: 50 };
    const result = await step.execute(contextNeutral);
    assert.strictEqual(result._signal, 'skip');
    assert.match(result._reason || '', /No rules matched/);
  });

  it('should match direct single condition rule', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsi14 > 70 -> close\nrsi14 < 30 -> open',
      defaultSignal: 'skip',
    });

    const contextOversold = { ...baseContext, rsi14: 25 };
    const result = await step.execute(contextOversold);
    assert.strictEqual(result._signal, 'open');
    assert.match(result._reason || '', /matched rule: "rsi14 < 30 -> open"/i);
  });

  it('should support default keyword inside rules', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsi14 > 70 -> close\ndefault -> close+open',
    });

    const contextNeutral = { ...baseContext, rsi14: 50 };
    const result = await step.execute(contextNeutral);
    assert.strictEqual(result._signal, 'close+open');
  });

  it('should ignore comment lines', async () => {
    const step = new ConditionDecisionStep({
      rules: '# This is a comment\nrsi14 > 70 -> close\n# Another comment\ndefault -> skip',
    });

    const contextHigh = { ...baseContext, rsi14: 80 };
    const result = await step.execute(contextHigh);
    assert.strictEqual(result._signal, 'close');
  });

  it('should parse and evaluate compound AND expressions', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsi14 > 10 && rsi10 > 20 && rsi14 < 40 -> close+open\ndefault -> skip',
    });

    const contextMatch = { ...baseContext, rsi14: 30, rsi10: 25 };
    const resultMatch = await step.execute(contextMatch);
    assert.strictEqual(resultMatch._signal, 'close+open');

    const contextNoMatch = { ...baseContext, rsi14: 45, rsi10: 25 };
    const resultNoMatch = await step.execute(contextNoMatch);
    assert.strictEqual(resultNoMatch._signal, 'skip');
  });

  it('should parse and evaluate compound OR expressions', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsi14 > 70 || rsi14 < 30 -> close+open\ndefault -> skip',
    });

    const contextHigh = { ...baseContext, rsi14: 75 };
    const resultHigh = await step.execute(contextHigh);
    assert.strictEqual(resultHigh._signal, 'close+open');

    const contextLow = { ...baseContext, rsi14: 25 };
    const resultLow = await step.execute(contextLow);
    assert.strictEqual(resultLow._signal, 'close+open');

    const contextNeutral = { ...baseContext, rsi14: 50 };
    const resultNeutral = await step.execute(contextNeutral);
    assert.strictEqual(resultNeutral._signal, 'skip');
  });

  it('should handle unary negation !field', async () => {
    const step = new ConditionDecisionStep({
      rules: '!priceAboveSma -> close\ndefault -> skip',
    });

    const contextBelow = { ...baseContext, priceAboveSma: false };
    const resultBelow = await step.execute(contextBelow);
    assert.strictEqual(resultBelow._signal, 'close');

    const contextAbove = { ...baseContext, priceAboveSma: true };
    const resultAbove = await step.execute(contextAbove);
    assert.strictEqual(resultAbove._signal, 'skip');
  });

  it('should evaluate custom output keys and comparisons correctly', async () => {
    const step = new ConditionDecisionStep({
      rules: 'rsiPeriod == 14 && priceAboveSma == false -> close\ndefault -> skip',
    });

    const contextMatch = { ...baseContext, rsiPeriod: 14, priceAboveSma: false };
    const resultMatch = await step.execute(contextMatch);
    assert.strictEqual(resultMatch._signal, 'close');
  });

  it('should parse and strip quotes for string fields comparison', async () => {
    const step = new ConditionDecisionStep({
      rules: 'customStatus == "danger" -> close\ncustomStatus == \'warning\' -> skip\ndefault -> open',
    });

    const contextDanger = { ...baseContext, customStatus: 'danger' };
    const resultDanger = await step.execute(contextDanger);
    assert.strictEqual(resultDanger._signal, 'close');

    const contextWarning = { ...baseContext, customStatus: 'warning' };
    const resultWarning = await step.execute(contextWarning);
    assert.strictEqual(resultWarning._signal, 'skip');
  });
});

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
