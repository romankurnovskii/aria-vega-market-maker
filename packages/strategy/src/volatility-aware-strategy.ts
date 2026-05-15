/**
 * @file volatility-aware-strategy.ts
 * @description Volatility-aware trailing strategy: adds volatility check before rebalancing.
 *
 * @features
 * - Adds VolatilityCheckStep after InitializationCheckStep
 * - Blocks rebalancing when price volatility exceeds threshold
 * - Prevents losses from rebalancing during high volatility periods
 *
 * @dependencies IStrategy, Workflow, all step classes from @lp-system/steps
 * @sideEffects None
 */
import { IStrategy, Position, MarketSnapshot, StrategyResult, StepContext } from '@lp-system/core';
import {
  InitializationCheckStep,
  HighFeeCheckStep,
  TrailingRangeCheckStep,
  RangeCalculatorStep,
  AmountCalculatorStep,
  VolatilityCheckStep,
} from '@lp-system/steps';
import { Workflow } from './workflow.js';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('volatility-aware-strategy');

export class VolatilityAwareStrategy implements IStrategy {
  public id = 'volatility-aware';
  public description = 'Dynamic range trailing with volatility check to prevent rebalancing during high volatility';
  private workflow: Workflow;

  constructor(private defaultParams: Record<string, unknown> = {}) {
    this.workflow = new Workflow([
      new InitializationCheckStep(),
      new HighFeeCheckStep(),
      new VolatilityCheckStep(),
      new TrailingRangeCheckStep(),
      new RangeCalculatorStep(),
      new AmountCalculatorStep(),
    ]);
  }

  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    logger.info(`[VolatilityAwareStrategy] Initiating strategy evaluation for position: ${position.id}`);

    const mergedParams = {
      ...this.defaultParams,
      ...params,
    };

    const initialContext: StepContext = {
      position,
      market,
      params: mergedParams,
    };

    const finalContext = await this.workflow.run(initialContext);

    logger.info(
      `[VolatilityAwareStrategy] Finished evaluation. Signal: ${finalContext.signal || 'skip'}. Reason: ${finalContext.reason || 'None'}`
    );

    if (finalContext.signal === 'close+open' && finalContext.openParams) {
      return { action: 'close+open', openParams: finalContext.openParams };
    }

    if (finalContext.signal === 'close') {
      return { action: 'close' };
    }

    if (finalContext.signal === 'open' && finalContext.openParams) {
      return { action: 'open', openParams: finalContext.openParams };
    }

    return { action: 'skip' };
  }
}
