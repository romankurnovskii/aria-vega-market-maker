/**
 * @file initialization-check-step.ts
 * @description First pipeline step: validates that the position has liquidity before proceeding.
 *
 * @features
 * - Checks both tokenX and tokenY amounts for zero liquidity
 * - Emits CLOSE signal if both amounts are zero (uninitialized or closed position)
 * - Passes through unchanged if position has liquidity
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure check with no state mutation
 */
import { IStep, StepContext } from '@lp-system/core';

/**
 * InitializationCheckStep: guards against processing empty/uninitialized positions.
 * Emits 'close' signal if both token amounts are zero.
 */
export class InitializationCheckStep implements IStep {
  public name = 'InitializationCheckStep';

  /**
   * Executes the initialization check.
   *
   * @param {StepContext} context - Pipeline context carrying position, market, params, and existing signal.
   * @returns {Promise<StepContext>} Updated context with signal='close' if zero liquidity; else unchanged.
   */
  public async execute(context: StepContext): Promise<StepContext> {
    console.log(`[${this.name}] Checking initialization status for position: ${context.position.id}`);

    const hasLiquidityX = BigInt(context.position.tokenX.amount) > 0n;
    const hasLiquidityY = BigInt(context.position.tokenY.amount) > 0n;

    if (!hasLiquidityX && !hasLiquidityY) {
      console.log(`[${this.name}] Position has zero liquidity. Signalling CLOSE.`);
      return {
        ...context,
        signal: 'close',
        reason: 'Position holds zero liquidity'
      };
    }

    console.log(`[${this.name}] Position is initialized and active.`);
    return context;
  }
}
