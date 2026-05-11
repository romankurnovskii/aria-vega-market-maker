import {
  IStrategy,
  Position,
  MarketSnapshot,
  StrategyResult,
  StepContext
} from '@lp-system/core';
import {
  InitializationCheckStep,
  TrailingRangeCheckStep,
  RangeCalculatorStep,
  AmountCalculatorStep
} from '@lp-system/steps';
import { Workflow } from './workflow.js';

export class TrailingUsdcStrategy implements IStrategy {
  public id = 'trailing-usdc';
  private workflow: Workflow;

  constructor(private defaultParams: Record<string, unknown> = {}) {
    // Set up the static workflow pipeline using reusable steps
    this.workflow = new Workflow([
      new InitializationCheckStep(),
      new TrailingRangeCheckStep(),
      new RangeCalculatorStep(),
      new AmountCalculatorStep()
    ]);
  }

  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    console.log(`[TrailingUsdcStrategy] Initiating strategy evaluation for position: ${position.id}`);

    const mergedParams = {
      ...this.defaultParams,
      ...params
    };

    const initialContext: StepContext = {
      position,
      market,
      params: mergedParams
    };

    const finalContext = await this.workflow.run(initialContext);

    console.log(`[TrailingUsdcStrategy] Finished evaluation. Signal: ${finalContext.signal || 'skip'}. Reason: ${finalContext.reason || 'None'}`);

    if (finalContext.signal === 'close+open' && finalContext.openParams) {
      return {
        action: 'close+open',
        openParams: finalContext.openParams
      };
    }

    if (finalContext.signal === 'close') {
      return {
        action: 'close'
      };
    }

    if (finalContext.signal === 'open' && finalContext.openParams) {
      return {
        action: 'open',
        params: finalContext.openParams
      };
    }

    return {
      action: 'skip'
    };
  }
}
