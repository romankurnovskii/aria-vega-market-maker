import { IStep, StepContext } from '@lp-system/core';

export class RangeCalculatorStep implements IStep {
  public name = 'RangeCalculatorStep';

  public async execute(context: StepContext): Promise<StepContext> {
    if (context.signal !== 'close+open') {
      return context;
    }

    console.log(`[${this.name}] Calculating optimal CLMM bin boundaries around active bin ${context.market.activeBinId}`);

    const rangePercent = (context.params.rangePercent as number) || 20;
    // For CLMM, rangePercent maps to a set number of bins (e.g. 100 bins width)
    const binCount = Math.floor(rangePercent * 5); // Simple linear multiplier for demonstration

    const lowerBinId = context.market.activeBinId - Math.floor(binCount / 2);
    const upperBinId = context.market.activeBinId + Math.floor(binCount / 2);

    console.log(`[${this.name}] Calculated new range bins: [${lowerBinId}, ${upperBinId}] (width: ${binCount} bins)`);

    return {
      ...context,
      openParams: {
        poolAddress: context.market.poolAddress,
        lowerBinId,
        upperBinId,
        tokenXAmount: '0',
        tokenYAmount: '0'
      }
    };
  }
}
