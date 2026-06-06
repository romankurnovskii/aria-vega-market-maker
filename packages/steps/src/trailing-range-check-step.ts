/**
 * @file trailing-range-check-step.ts
 * @description Core range alignment check: detects if active price bound has drifted outside the position's boundaries.
 *
 * @features
 * - Compares market.activeBound against position.lowerBound and upperBound
 * - Sets 'isInRange' to true if active bound is within position bounds, false otherwise
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure check, updates context with isInRange boolean
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
    ],
    outputs: [{ key: 'isInRange', type: 'boolean', description: 'Whether the active bound is within position boundaries' }],
    params: [],
  };

  /**
   * Checks if the current active bound lies within the position's boundary range.
   *
   * @param {StepContext} context - Pipeline context with position and market data.
   * @returns {Promise<StepContext>} Updated context with isInRange set.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(
      `[${this.name}] Checking range alignment. Position range: [${context.position.lowerBound}, ${context.position.upperBound}]. Active bound: ${context.market.activeBound}`
    );

    const isActiveBoundInRange =
      context.market.activeBound >= context.position.lowerBound && context.market.activeBound <= context.position.upperBound;

    return {
      ...context,
      isInRange: isActiveBoundInRange,
    };
  }
}
