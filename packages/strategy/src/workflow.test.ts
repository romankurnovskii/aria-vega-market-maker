/**
 * @file workflow.test.ts
 * @description Unit tests for the Workflow runner, verifying runIf conditional execution and skip logic.
 *
 * @dependencies node:test, node:assert, @lp-system/core, @lp-system/strategy
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IStep, PipelineContext, StepDescriptor } from '@lp-system/core';
import { Workflow } from './workflow.js';

const dummyToken = { tokenAddress: 'dummy', decimals: 6, amount: '0' };

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

class DummyStep implements IStep {
  public executedCount = 0;
  constructor(
    public name: string,
    public descriptor: StepDescriptor,
    public mutateFn: (ctx: PipelineContext) => PipelineContext,
    public runIf?: IStep['runIf']
  ) {}

  public async execute(context: PipelineContext): Promise<PipelineContext> {
    this.executedCount++;
    return this.mutateFn(context);
  }
}

const dummyDescriptor: StepDescriptor = {
  id: 'dummy',
  name: 'Dummy Step',
  description: 'Dummy',
  category: 'custom',
  inputs: [],
  outputs: [],
  params: [],
};

describe('Workflow - runIf Conditional Gating', () => {
  it('should run a step if it has no runIf condition', async () => {
    const step = new DummyStep('step-1', dummyDescriptor, (ctx) => ({ ...ctx, value1: 'executed' }));
    const workflow = new Workflow([step]);
    const finalCtx = await workflow.run(baseContext);

    assert.strictEqual(step.executedCount, 1);
    assert.strictEqual(finalCtx.value1, 'executed');
  });

  it('should skip a step if its runIf condition evaluates to false', async () => {
    const step = new DummyStep('step-conditional', dummyDescriptor, (ctx) => ({ ...ctx, value2: 'should-not-run' }), {
      field: 'flag',
      operator: 'eq',
      value: true,
    });
    const workflow = new Workflow([step]);
    const initial = { ...baseContext, flag: false };
    const finalCtx = await workflow.run(initial);

    assert.strictEqual(step.executedCount, 0);
    assert.strictEqual(finalCtx.value2, undefined);
  });

  it('should run a step if its runIf condition evaluates to true', async () => {
    const step = new DummyStep('step-conditional', dummyDescriptor, (ctx) => ({ ...ctx, value3: 'ran' }), {
      field: 'flag',
      operator: 'eq',
      value: true,
    });
    const workflow = new Workflow([step]);
    const initial = { ...baseContext, flag: true };
    const finalCtx = await workflow.run(initial);

    assert.strictEqual(step.executedCount, 1);
    assert.strictEqual(finalCtx.value3, 'ran');
  });

  it('should correctly skip a step based on custom operators (e.g. gt, falsy)', async () => {
    const step1 = new DummyStep('step-gt', dummyDescriptor, (ctx) => ({ ...ctx, hitGt: true }), {
      field: 'num',
      operator: 'gt',
      value: 10,
    });
    const step2 = new DummyStep('step-falsy', dummyDescriptor, (ctx) => ({ ...ctx, hitFalsy: true }), {
      field: 'missingField',
      operator: 'falsy',
      value: '',
    });

    const workflow = new Workflow([step1, step2]);
    const initial = { ...baseContext, num: 5 }; // num <= 10, so step1 should skip
    const finalCtx = await workflow.run(initial);

    assert.strictEqual(step1.executedCount, 0);
    assert.strictEqual(step2.executedCount, 1); // missingField is undefined/falsy, so step2 should run
    assert.strictEqual(finalCtx.hitGt, undefined);
    assert.strictEqual(finalCtx.hitFalsy, true);
  });
});
