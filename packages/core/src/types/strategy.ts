/**
 * @file strategy.ts
 * @description TypeScript interfaces and unions for strategy execution and recommendations.
 *
 * @features
 * - StepContext: Pipeline context carrying position, market, params, and signal data
 * - StrategyResult: Discriminated union of possible strategy outcomes (skip/close/open/close+open)
 * - Recommendation: Output from an orchestrator's tick, linking assignment to result
 * - LPEvent: Immutable event log entry for position lifecycle events
 *
 * @dependencies StrategyAction enum (from enums.ts), OpenParams (from position.ts), MarketSnapshot (from market.ts)
 * @sideEffects None — type definitions only
 */
import { StrategyAction } from './enums';
import { Position, OpenParams } from './position';
import { MarketSnapshot } from './market';

export interface CalculatedPrices {
  lowerPrice: number;
  upperPrice: number;
  midPrice: number;
  geometricAverage: number;
  spotAverage: number;
  convexityBenefit: number;
  effectiveBreakEven?: number;
}

export interface StepContext {
  position: Position;
  market: MarketSnapshot;
  params: Record<string, unknown>; // strategy config
  signal?: StrategyAction | 'skip' | 'close' | 'open' | 'close+open'; // Accept both enums and literal values
  openParams?: OpenParams;
  reason?: string;
  calculations?: CalculatedPrices;
  [key: string]: unknown; // Allow arbitrary custom outputs
}

export type StrategyResult =
  | { action: StrategyAction.SKIP | 'skip'; signal?: string; reason?: string; metrics?: CalculatedPrices }
  | { action: StrategyAction.CLOSE | 'close'; signal?: string; reason?: string; metrics?: CalculatedPrices }
  | {
      action: StrategyAction.OPEN | 'open';
      openParams: OpenParams;
      signal?: string;
      reason?: string;
      metrics?: CalculatedPrices;
    }
  | {
      action: StrategyAction.CLOSE_OPEN | 'close+open';
      openParams: OpenParams;
      signal?: string;
      reason?: string;
      metrics?: CalculatedPrices;
    };

export interface Recommendation {
  assignmentId: string;
  result: StrategyResult;
}

export interface LPEvent {
  id: string;
  type: 'position_opened' | 'position_closed' | 'rebalance_triggered' | 'error';
  timestamp: number;
  data: Record<string, unknown>;
}
