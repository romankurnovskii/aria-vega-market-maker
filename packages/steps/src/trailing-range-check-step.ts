/**
 * @file trailing-range-check-step.ts
 * @description Core range alignment check: detects if active price bound has drifted outside the position's boundaries.
 *
 * @features
 * - Compares market.activeBound against position.lowerBound and upperBound
 * - Emits 'close+open' signal when active bound exits range (triggers rebalance)
 * - Emits 'skip' when price is within bounds (position remains in-range)
 * - Respects prior signals: if a previous step already set a signal, this step passes through
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure check, no mutations beyond signal/reason in context
 */
import { IStep, StepContext, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('trailing-range-check-step');

export class TrailingRangeCheckStep implements IStep {
  public name = 'TrailingRangeCheckStep';

  public readonly descriptor: StepDescriptor = {
    id: 'trailing-range-check',
    name: 'Trailing Range Check',
    description: 'Detects if active price bound has drifted outside the position boundaries.',
    category: 'guard',
    inputs: [
      { key: 'position', type: 'Position', description: 'Current LP position bounds' },
      { key: 'market', type: 'MarketSnapshot', description: 'Current active market bound' },
      { key: 'signal', type: 'string', description: 'Prior signal (if any)', required: false },
    ],
    outputs: [
      { key: 'signal', type: 'string', description: 'Set to "close+open" or "skip"' },
      { key: 'reason', type: 'string', description: 'Explanation' },
      { key: 'isInRange', type: 'boolean', description: 'Whether the active bound is within position boundaries' },
    ],
    params: [],
  };

  /**
   * Checks if the current active bound lies within the position's boundary range.
   *
   * @param {StepContext} context - Pipeline context with position and market data.
   * @returns {Promise<StepContext>} Updated context with signal and reason set if out of range.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(
      `[${this.name}] Checking range alignment. Position range: [${context.position.lowerBound}, ${context.position.upperBound}]. Active bound: ${context.market.activeBound}`
    );

    // If a previous step already set a signal, we respect it and skip.
    if (context.signal) {
      return context;
    }

    const isActiveBoundInRange =
      context.market.activeBound >= context.position.lowerBound && context.market.activeBound <= context.position.upperBound;

    if (!isActiveBoundInRange) {
      logger.warn(
        `[${this.name}] Active bound ${context.market.activeBound} is OUT of position range. Triggering close+open rebalance.`
      );
      return {
        ...context,
        isInRange: false,
        signal: 'close+open',
        reason: `Active bound ${context.market.activeBound} shifted out of range [${context.position.lowerBound}, ${context.position.upperBound}]`,
      };
    }

    logger.info(`[${this.name}] Active bound is healthy and within range boundaries.`);
    return {
      ...context,
      isInRange: true,
      signal: 'skip',
      reason: 'Active bound remains within range',
    };
  }
}
