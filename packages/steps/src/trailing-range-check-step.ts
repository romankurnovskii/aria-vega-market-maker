import { IStep, StepContext } from '@lp-system/core';

export class TrailingRangeCheckStep implements IStep {
  public name = 'TrailingRangeCheckStep';

  public async execute(context: StepContext): Promise<StepContext> {
    console.log(`[${this.name}] Checking range alignment. Position range: [${context.position.lowerBinId}, ${context.position.upperBinId}]. Active bin: ${context.market.activeBinId}`);

    // If a previous step already set a signal, we respect it and skip.
    if (context.signal) {
      return context;
    }

    const isActiveBinInRange =
      context.market.activeBinId >= context.position.lowerBinId &&
      context.market.activeBinId <= context.position.upperBinId;

    if (!isActiveBinInRange) {
      console.log(`[${this.name}] Active bin ${context.market.activeBinId} is OUT of position range. Triggering close+open rebalance.`);
      return {
        ...context,
        signal: 'close+open',
        reason: `Active bin ${context.market.activeBinId} shifted out of range [${context.position.lowerBinId}, ${context.position.upperBinId}]`
      };
    }

    console.log(`[${this.name}] Active bin is healthy and within range boundaries.`);
    return {
      ...context,
      signal: 'skip',
      reason: 'Active bin remains within range'
    };
  }
}
