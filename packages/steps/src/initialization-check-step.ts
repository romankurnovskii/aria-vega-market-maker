import { IStep, StepContext } from '@lp-system/core';

export class InitializationCheckStep implements IStep {
  public name = 'InitializationCheckStep';

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
