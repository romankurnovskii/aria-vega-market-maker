/**
 * @file high-fee-check-step.ts
 * @description Detects positions with accrued fees exceeding a configurable threshold.
 *
 * @features
 * - Reads feeX and feeY from position metadata (populated by Meteora API provider)
 * - Compares total accrued fees against a configurable threshold in USD
 * - Emits 'skip' signal when fees are below threshold (allow normal rebalancing)
 * - Emits 'skip' with reason when fees are high but rebalancing already signaled (preserve existing decision)
 * - Emits 'close' signal when fees exceed threshold (suggest closing position to collect fees)
 * - Respects prior signals: never overrides an existing signal
 *
 * @dependencies IStep, StepContext (from @lp-system/core)
 * @sideEffects None — pure check, no mutations beyond signal/reason in context
 */
import { IStep, StepContext } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('high-fee-check-step');

export interface HighFeeCheckParams {
  minFeeUsdThreshold?: number;
  feeXDecimals?: number;
  feeYDecimals?: number;
  priceX?: number;
  priceY?: number;
}

const DEFAULT_MIN_FEE_USD = 10;

export class HighFeeCheckStep implements IStep {
  public name = 'HighFeeCheckStep';

  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Checking for high-fee positions on ${context.position.id}`);

    if (context.signal) {
      logger.info(`[${this.name}] Prior signal '${context.signal}' detected, skipping fee check to preserve decision.`);
      return context;
    }

    const params = (context.params.highFeeCheck as HighFeeCheckParams) || {};
    const minFeeUsd = (params.minFeeUsdThreshold ?? DEFAULT_MIN_FEE_USD) as number;
    const feeXDecimals = (params.feeXDecimals ?? 6) as number;
    const feeYDecimals = (params.feeYDecimals ?? 6) as number;
    const priceX = (params.priceX ?? 1) as number;
    const priceY = (params.priceY ?? 1) as number;

    const feeXStr = context.position.metadata?.feeX as string | undefined;
    const feeYStr = context.position.metadata?.feeY as string | undefined;

    const feeX = feeXStr ? Number(feeXStr) / Math.pow(10, feeXDecimals) : 0;
    const feeY = feeYStr ? Number(feeYStr) / Math.pow(10, feeYDecimals) : 0;

    const totalFeeUsd = feeX * priceY + feeY * priceX;

    logger.info(
      `[${this.name}] Fee summary - feeX: ${feeX.toFixed(4)}, feeY: ${feeY.toFixed(4)}, total USD: ${totalFeeUsd.toFixed(2)}, threshold: ${minFeeUsd}`
    );

    if (totalFeeUsd >= minFeeUsd) {
      logger.warn(
        `[${this.name}] High fee position detected! Total accrued fees: $${totalFeeUsd.toFixed(2)} exceeds threshold $${minFeeUsd}. Suggesting close to collect fees.`
      );
      return {
        ...context,
        signal: 'close',
        reason: `High accrued fees: $${totalFeeUsd.toFixed(2)} exceeds threshold $${minFeeUsd}`,
      };
    }

    logger.info(`[${this.name}] Fees below threshold. Total: $${totalFeeUsd.toFixed(2)} < $${minFeeUsd}.`);
    return {
      ...context,
      signal: 'skip',
      reason: `Accrued fees $${totalFeeUsd.toFixed(2)} below threshold $${minFeeUsd}`,
    };
  }
}
