/**
 * @file trailing-usdc-strategy.ts
 * @description Trailing USDC strategy: rebalances CLMM position when price moves out of range.
 *
 * @features
 * - Executes multi-step workflow: init check → trailing range check → range calculator → amount calculator
 * - Maintains configurable trailing percent (rangePercent) defining bin width around active price
 * - Emits close+open recommendation when active bin drifts outside current position range
 * - Emits skip when position remains healthy; emits close for zero-liquidity positions
 *
 * @dependencies IStrategy interface, Workflow (pipeline orchestration), all step classes from @lp-system/steps
 * @sideEffects None — pure computation, recommendations passed to ExecutionGate for dispatch
 */
import { IStrategy, Position, MarketSnapshot, StrategyResult, StepContext } from '@lp-system/core';
import {
  InitializationCheckStep,
  TrailingRangeCheckStep,
  RangeCalculatorStep,
  AmountCalculatorStep,
} from '@lp-system/steps';
import { Workflow } from './workflow.js';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('trailing-usdc-strategy');

/**
 * TrailingUsdcStrategy: maintains a CLMM LP position centered on the active price bin.
 * Rebalances (close+open) when price exits the current range. Uses configurable range width.
 */
export class TrailingUsdcStrategy implements IStrategy {
  public id = 'trailing-usdc';
  public description = 'Dynamic range trailing for USDC pairs using Meteora DLMM';
  private workflow: Workflow;

  /**
   * Constructs the strategy with default params (e.g., rangePercent: 20).
   *
   * @param {Record<string, unknown>} [defaultParams={}] - Default configuration, including `rangePercent`.
   */
  constructor(private defaultParams: Record<string, unknown> = {}) {
    // Set up the static workflow pipeline using reusable steps
    this.workflow = new Workflow([
      new InitializationCheckStep(),
      new TrailingRangeCheckStep(),
      new RangeCalculatorStep(),
      new AmountCalculatorStep(),
    ]);
  }

  /**
   * Executes the strategy pipeline against a position/market context.
   * Merges defaultParams with per-call params, runs Workflow, and translates StepContext.signal into StrategyResult.
   *
   * @param {Position} position - Current position state.
   * @param {MarketSnapshot} market - Current market snapshot (price, active bin).
   * @param {Record<string, unknown>} params - Per-call strategy configuration (overrides defaults).
   * @returns {Promise<StrategyResult>} One of: skip / close / open / close+open.
   */
  public async execute(
    position: Position,
    market: MarketSnapshot,
    params: Record<string, unknown>
  ): Promise<StrategyResult> {
    logger.info(`[TrailingUsdcStrategy] Initiating strategy evaluation for position: ${position.id}`);

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
      `[TrailingUsdcStrategy] Market snapshot - active bound: ${market.activeBound}, position range: [${position.lowerBound}, ${position.upperBound}]`
    );

    const finalContext = await this.workflow.run(initialContext);

    logger.info(
      `[TrailingUsdcStrategy] Finished evaluation. Signal: ${finalContext.signal || 'skip'}. Reason: ${finalContext.reason || 'None'}`
    );

    if (finalContext.signal === 'close+open' && finalContext.openParams) {
      logger.info(`[TrailingUsdcStrategy] Decision: close+open with params`);
      return {
        action: 'close+open',
        openParams: finalContext.openParams,
      };
    }

    if (finalContext.signal === 'close') {
      logger.info(`[TrailingUsdcStrategy] Decision: close`);
      return {
        action: 'close',
      };
    }

if (finalContext.signal === 'open' && finalContext.openParams) {
       logger.info(`[TrailingUsdcStrategy] Decision: open with params`);
       return {
         action: 'open',
         openParams: finalContext.openParams,
       };
     }

    logger.info(`[TrailingUsdcStrategy] Decision: skip`);
    return {
      action: 'skip',
    };
  }
}
