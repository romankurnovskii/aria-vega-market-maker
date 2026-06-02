/**
 * @file context-setup-step.ts
 * @description Injects user-defined values into the strategy execution context. Primarily used as the first node in the UI builder to setup mock positions and environments for simulation.
 *
 * @features
 * - Overrides `context.position` amounts and pool address
 * - Overrides `context.market` price and bounds
 * - Passes through the updated context
 *
 * @dependencies IStep, StepContext, StepDescriptor (from @lp-system/core)
 * @sideEffects Mutates context.position and context.market
 */
import { IStep, StepContext, StepDescriptor, Position, MarketSnapshot } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('context-setup-step');

export class ContextSetupStep implements IStep {
  public name = 'ContextSetupStep';

  public readonly descriptor: StepDescriptor = {
    id: 'context-setup',
    name: 'Context Setup',
    description:
      'Initializes the execution context with specific pool, token amounts, and price range. Use this as the first node to setup mock data for simulation.',
    category: 'setup',
    inputs: [],
    outputs: [
      { key: 'position', type: 'Position', description: 'Updated position data' },
      { key: 'market', type: 'MarketSnapshot', description: 'Updated market data' },
    ],
    params: [
      {
        key: 'poolAddress',
        type: 'string',
        description: 'Address of the pool',
        default: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
      },
      { key: 'tokenXAmount', type: 'string', description: 'Initial amount of Token X (base)', default: '0' },
      { key: 'tokenYAmount', type: 'string', description: 'Initial amount of Token Y (quote)', default: '100' },
      { key: 'currentPrice', type: 'number', description: 'Current market price', default: 100 },
      { key: 'rangeMin', type: 'number', description: 'Lower bound of the active price range', default: 99.5 },
      { key: 'rangeMax', type: 'number', description: 'Upper bound of the active price range', default: 100.5 },
    ],
  };

  private params: Record<string, unknown>;

  constructor(params: Record<string, unknown> = {}) {
    this.params = {
      poolAddress: params.poolAddress || '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
      tokenXAmount: params.tokenXAmount || '0',
      tokenYAmount: params.tokenYAmount || '100',
      currentPrice: params.currentPrice !== undefined ? params.currentPrice : 100,
      rangeMin: params.rangeMin !== undefined ? params.rangeMin : 90,
      rangeMax: params.rangeMax !== undefined ? params.rangeMax : 110,
    };
  }

  public async execute(context: StepContext): Promise<StepContext> {
    logger.info(`[${this.name}] Setting up context with mock parameters.`);

    const poolAddress = String(this.params.poolAddress);
    const tokenXAmount = String(this.params.tokenXAmount);
    const tokenYAmount = String(this.params.tokenYAmount);
    const rangeMin = Number(this.params.rangeMin);
    const rangeMax = Number(this.params.rangeMax);

    // Determine the price to use – prefer existing market price when available
    let price: number | undefined = undefined;
    if (context.market?.price !== undefined) {
      price = context.market.price;
      logger.info(`[${this.name}] Using existing market price from context: ${price}`);
    } else if (this.params.currentPrice !== undefined) {
      price = Number(this.params.currentPrice);
      logger.info(`[${this.name}] Using provided currentPrice param: ${price}`);
    }

    if (price === undefined) {
      // No price source available – abort to avoid silent mock values
      const errMsg = 'ContextSetupStep requires a market price either from context or currentPrice param.';
      logger.error(`[${this.name}] ${errMsg}`);
      throw new Error(errMsg);
    }

    // Deep clone and override the context
    const updatedContext = { ...context };

    if (updatedContext.position) {
      updatedContext.position = {
        ...updatedContext.position,
        poolAddress: poolAddress,
        tokenX: { ...updatedContext.position.tokenX, amount: tokenXAmount },
        tokenY: { ...updatedContext.position.tokenY, amount: tokenYAmount },
      };
    } else {
      updatedContext.position = {
        id: 'mock-position',
        poolAddress: poolAddress,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        lowerBound: 0,
        upperBound: 0,
        tokenX: { amount: tokenXAmount, decimals: 6, tokenAddress: 'mock-x' },
        tokenY: { amount: tokenYAmount, decimals: 6, tokenAddress: 'mock-y' },
        isInRange: true,
        openedAt: Date.now(),
        metadata: {},
        state: 'OPEN',
      } as Position;
    }

    if (updatedContext.market) {
      updatedContext.market = {
        ...updatedContext.market,
        poolAddress: poolAddress,
        price: price,
        // Override activeBound only if not already set
        activeBound: updatedContext.market.activeBound !== undefined ? updatedContext.market.activeBound : rangeMax,
      };
    } else {
      updatedContext.market = {
        poolAddress: poolAddress,
        chain: 'solana',
        protocol: 'meteora_dlmm',
        activeBound: rangeMax,
        price: price,
        priceHistory: [],
        feeRate: 0.01,
        capturedAt: Date.now(),
      } as MarketSnapshot;
    }

    updatedContext.rangeMin = rangeMin;
    updatedContext.rangeMax = rangeMax;

    return updatedContext;
  }
}
