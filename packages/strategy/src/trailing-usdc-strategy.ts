/**
 * @file trailing-usdc-strategy.ts
 * @description Trailing USDC strategy: rebalances CLMM position when price moves out of range.
 *
 * @features
 * - Executes multi-step workflow: init check → high fee check → trailing range check → range calculator → amount calculator
 * - Maintains configurable trailing percent (rangePercent) defining bin width around active price
 * - Emits close+open recommendation when active bin drifts outside current position range
 * - Emits close when accrued fees exceed threshold (suggest closing to collect fees)
 * - Emits skip when position remains healthy; emits close for zero-liquidity positions
 *
 * @dependencies IStrategy interface, Workflow (pipeline orchestration), all step classes from @lp-system/steps
 * @sideEffects None — pure computation
 */
import { IStrategy, Position, MarketSnapshot, StrategyResult, StrategyDefinition } from '@lp-system/core';
import {
  InitializationCheckStep,
  TrailingRangeCheckStep,
  RangeCalculatorStep,
  AmountCalculatorStep,
  HighFeeCheckStep,
} from '@lp-system/steps';
import { DataDrivenStrategy } from './data-driven-strategy.js';
import { StepRegistry } from './step-registry.js';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('trailing-usdc-strategy');

export const trailingUsdcDefinition: StrategyDefinition = {
  id: 'trailing-usdc',
  name: 'Trailing USDC',
  description: 'Dynamic range trailing for USDC pairs using Meteora DLMM',
  steps: [
    { stepId: 'initialization-check', params: {} },
    { stepId: 'high-fee-check', params: {} },
    { stepId: 'trailing-range-check', params: {} },
    { stepId: 'range-calculator', params: {} },
    { stepId: 'amount-calculator', params: {} },
  ],
  defaultParams: {},
};

/**
 * TrailingUsdcStrategy: maintains a CLMM LP position centered on the active price bin.
 * Rebalances (close+open) when price exits the current range. Uses configurable range width.
 */
export class TrailingUsdcStrategy implements IStrategy {
  public id = 'trailing-usdc';
  public description = 'Dynamic range trailing for USDC pairs using Meteora DLMM';
  private dataDrivenStrategy: DataDrivenStrategy;

  /**
   * Constructs the strategy with default params (e.g., rangePercent: 20).
   *
   * @param {Record<string, unknown>} [defaultParams={}] - Default configuration, including `rangePercent`.
   */
  constructor(defaultParams: Record<string, unknown> = {}) {
    // Create a local registry for backward compatibility
    const registry = new StepRegistry();
    registry.register('initialization-check', () => new InitializationCheckStep(), new InitializationCheckStep().descriptor);
    registry.register('high-fee-check', () => new HighFeeCheckStep(), new HighFeeCheckStep().descriptor);
    registry.register('trailing-range-check', () => new TrailingRangeCheckStep(), new TrailingRangeCheckStep().descriptor);
    registry.register('range-calculator', () => new RangeCalculatorStep(), new RangeCalculatorStep().descriptor);
    registry.register('amount-calculator', () => new AmountCalculatorStep(), new AmountCalculatorStep().descriptor);

    const definition = {
      ...trailingUsdcDefinition,
      defaultParams: { ...trailingUsdcDefinition.defaultParams, ...defaultParams },
    };

    this.dataDrivenStrategy = new DataDrivenStrategy(definition, registry);
  }

  /**
   * Executes the strategy pipeline against a position/market context.
   * Delegates to DataDrivenStrategy.
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
    logger.info(`[TrailingUsdcStrategy] Delegating execution to DataDrivenStrategy`);
    return this.dataDrivenStrategy.execute(position, market, params);
  }
}
