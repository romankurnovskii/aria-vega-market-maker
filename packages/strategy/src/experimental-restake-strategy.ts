import { IStrategy, Position, MarketSnapshot, StrategyResult, StepContext } from '@lp-system/core';
import { InitializationCheckStep, ClmmPricingStep, ExperimentalRestakeStep } from '@lp-system/steps';
import { getLogger } from '@lp-system/logger';
import { Workflow } from './workflow.js';

const logger = getLogger('experimental-restake-strategy');

export class ExperimentalRestakeStrategy implements IStrategy {
  public id = 'experimental-restake';
  public description = 'Experimental strategy to restake on price above range with configurable single-direction USDC';
  private workflow: Workflow;

  constructor(private defaultParams: Record<string, unknown> = {}) {
    // Construct the sequential pipeline workflow following standard architecture
    this.workflow = new Workflow([new InitializationCheckStep(), new ClmmPricingStep(), new ExperimentalRestakeStep()]);
  }

  /**
   * Sequential execution pipeline for evaluating rebalance decisions.
   *
   * @param {Position} position - Current active on-chain position context.
   * @param {MarketSnapshot} market - Current active pool market data snapshot.
   * @param {Record<string, unknown>} params - Overriding configuration parameters for evaluation.
   * @returns {Promise<StrategyResult>} Standardized action (skip/close/open/close+open) and params.
   */
  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    logger.info(`[ExperimentalRestakeStrategy] Initiating strategy evaluation for position: ${position.id}`);

    const mergedParams = {
      ...this.defaultParams,
      ...params,
    };

    const initialContext: StepContext = {
      position,
      market,
      params: mergedParams,
    };

    logger.info(
      `[ExperimentalRestakeStrategy] Market snapshot - active bound: ${market.activeBound}, position range: [${position.lowerBound}, ${position.upperBound}]`
    );

    // Run the step-based workflow pipeline
    const finalContext = await this.workflow.run(initialContext);

    logger.info(
      `[ExperimentalRestakeStrategy] Workflow evaluation complete. Signal: ${finalContext.signal || 'none'}, Reason: ${finalContext.reason || 'none'}`
    );

    if (finalContext.signal === 'close+open' && finalContext.openParams) {
      logger.info(`[ExperimentalRestakeStrategy] Decision: close+open with params`);
      return {
        action: 'close+open',
        openParams: finalContext.openParams,
      };
    }

    if (finalContext.signal === 'close') {
      logger.info(`[ExperimentalRestakeStrategy] Decision: close`);
      return {
        action: 'close',
      };
    }

    if (finalContext.signal === 'open' && finalContext.openParams) {
      logger.info(`[ExperimentalRestakeStrategy] Decision: open with params`);
      return {
        action: 'open',
        params: finalContext.openParams,
      };
    }

    logger.info(`[ExperimentalRestakeStrategy] Decision: skip`);
    return {
      action: 'skip',
    };
  }
}
