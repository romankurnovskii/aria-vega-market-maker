/**
 * @file experimental-restake-strategy.ts
 * @description WIP trailing + restake strategy: trails USDC-only up as price rises,
 *              averages in with SOL-only down as price falls. Uses a multi-step workflow.
 *
 * @features
 * - Composes InitializationCheckStep, ClmmPricingStep, and ExperimentalRestakeStep
 * - Implements IStrategy with evaluate() returning a rebalance suggestion or skip
 * - Delegates step execution to Workflow orchestrator
 *
 * @dependencies @lp-system/core (IStrategy), @lp-system/steps, @lp-system/logger, Workflow
 * @sideEffects None — pure composition and evaluation
 */

import { IStrategy, Position, MarketSnapshot, StrategyResult, StrategyDefinition } from '@lp-system/core';
import { InitializationCheckStep, ClmmPricingStep, ExperimentalRestakeStep } from '@lp-system/steps';
import { getLogger } from '@lp-system/logger';
import { DataDrivenStrategy } from './data-driven-strategy.js';
import { StepRegistry } from './step-registry.js';

const logger = getLogger('experimental-restake-strategy');

export const experimentalRestakeDefinition: StrategyDefinition = {
  id: 'experimental-restake',
  name: 'Experimental Restake',
  description:
    'Experimental trailing strategy: reopens with 0.15% (4-bin) USDC-only range when price is above range, and rolls SOL-only down-range maintaining average buy price when price is below range',
  steps: [
    { stepId: 'initialization-check', params: {} },
    { stepId: 'clmm-pricing', params: {} },
    { stepId: 'experimental-restake', params: {} },
  ],
  defaultParams: {},
};

/**
 * ExperimentalRestakeStrategy
 *
 * An experimental trailing and restake strategy that manages DLMM positions dynamically
 * based on pool price relative to position range bounds:
 *
 * 1. Price Above Range (Upward Trailing):
 *    - Triggers a close+open rebalance to lock in gains.
 *    - Reopens a tight single-direction USDC-only range.
 *    - Sets the new upper price bound to the current pool active price.
 *    - Sets the lower price bound to 0.15% below the current active price (approx. 4 bins width).
 *
 * 2. Price Below Range (Downward Re-average):
 *    - Triggers a down-range SOL-only rebalance.
 *    - Computes the average token buy price of the current position (using effective break-even or geometric average).
 *    - Sets the new lower price range to the current active pool price.
 *    - Dynamically computes the maximum (upper) price range such that the geometric average sell price of the range
 *      matches the calculated average token buy price, thereby keeping the average token purchase price unchanged.
 */
export class ExperimentalRestakeStrategy implements IStrategy {
  public id = 'experimental-restake';
  public description =
    'Experimental trailing strategy: reopens with 0.15% (4-bin) USDC-only range when price is above range, and rolls SOL-only down-range maintaining average buy price when price is below range';
  private dataDrivenStrategy: DataDrivenStrategy;

  constructor(defaultParams: Record<string, unknown> = {}) {
    const registry = new StepRegistry();
    registry.register('initialization-check', () => new InitializationCheckStep(), new InitializationCheckStep().descriptor);
    registry.register('clmm-pricing', () => new ClmmPricingStep(), new ClmmPricingStep().descriptor);
    registry.register('experimental-restake', () => new ExperimentalRestakeStep(), new ExperimentalRestakeStep().descriptor);

    const definition = {
      ...experimentalRestakeDefinition,
      defaultParams: { ...experimentalRestakeDefinition.defaultParams, ...defaultParams },
    };

    this.dataDrivenStrategy = new DataDrivenStrategy(definition, registry);
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
    logger.info(`[ExperimentalRestakeStrategy] Delegating evaluation to DataDrivenStrategy`);
    return this.dataDrivenStrategy.execute(position, market, params);
  }
}
