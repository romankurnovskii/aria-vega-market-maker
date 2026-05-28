import { PipelineContext, Position } from '@lp-system/core';
import { RsiIndicatorStep } from './rsi-indicator-step.js';
import { ConditionDecisionStep } from './condition-decision-step.js';

async function main() {
  console.log('--- Starting Pipeline Simulation ---');

  // 1. Generate some dummy price data indicating a strong uptrend
  let currentPrice = 1.0;
  const priceHistory = [];
  for (let i = 0; i < 20; i++) {
    priceHistory.push({ price: currentPrice, timestamp: Date.now() - (20 - i) * 60000 });
    currentPrice += 0.05; // price goes up by 0.05 every minute
  }

  // Initial context
  let context: PipelineContext = {
    position: {} as unknown as Position,
    market: {
      poolAddress: 'pool-dummy',
      chain: 'solana',
      protocol: 'meteora_dlmm',
      activeBound: 100,
      price: currentPrice,
      priceHistory,
      feeRate: 0.01,
      capturedAt: Date.now(),
    },
    params: {},
  };

  // 2. Instantiate the 3 RSI Steps with different periods and output keys
  const rsiStep1 = new RsiIndicatorStep({ period: 14, outputKey: 'rsi14' });
  const rsiStep2 = new RsiIndicatorStep({ period: 10, outputKey: 'rsi10' });
  const rsiStep3 = new RsiIndicatorStep({ period: 5, outputKey: 'rsi5' });

  // 3. Instantiate the Decision Step using JSON AST rules
  const decisionStep = new ConditionDecisionStep({
    rules: [
      {
        conditions: [
          { field: 'rsi14', operator: 'gt', value: 70 },
          { logicalOperator: 'AND', field: 'rsi10', operator: 'gt', value: 80 },
          { logicalOperator: 'AND', field: 'rsi5', operator: 'gt', value: 90 },
        ],
        signal: 'close+open', // Rebalance signal if strongly overbought across all timeframes
      },
    ],
    defaultSignal: 'skip',
  });

  // 4. Run the Pipeline!
  console.log('Executing RSI(14)...');
  context = await rsiStep1.execute(context);

  console.log('Executing RSI(10)...');
  context = await rsiStep2.execute(context);

  console.log('Executing RSI(5)...');
  context = await rsiStep3.execute(context);

  console.log('Context before decision block:', {
    rsi14: context.rsi14,
    rsi10: context.rsi10,
    rsi5: context.rsi5,
  });

  console.log('Executing Condition Decision...');
  context = await decisionStep.execute(context);

  console.log('--- Pipeline Result ---');
  console.log('Final Signal:', context._signal);
  console.log('Reason:', context._reason);
}

main().catch(console.error);
