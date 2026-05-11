import { IStep, StepContext } from '@lp-system/core';

export class AmountCalculatorStep implements IStep {
  public name = 'AmountCalculatorStep';

  public async execute(context: StepContext): Promise<StepContext> {
    if (!context.openParams) {
      return context;
    }

    console.log(`[${this.name}] Calculating optimal capital allocation for range: [${context.openParams.lowerBinId}, ${context.openParams.upperBinId}]`);

    // Fetch allocation params from strategy config or fallback to defaults
    const tokenXAmount = (context.params.tokenXAmount as string) || '1000000000'; // e.g., 1.0 SOL
    const tokenYAmount = (context.params.tokenYAmount as string) || '150000000';  // e.g., 150 USDC

    console.log(`[${this.name}] Allocating ${tokenXAmount} base token and ${tokenYAmount} quote token to the new position.`);

    return {
      ...context,
      openParams: {
        ...context.openParams,
        tokenXAmount,
        tokenYAmount
      }
    };
  }
}
