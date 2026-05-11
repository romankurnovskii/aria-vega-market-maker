/**
 * @file enums.ts
 * @description Strategy and decision action enums used throughout the system.
 *
 * @features
 * - StrategyAction: SKIP / CLOSE / OPEN / CLOSE_OPEN — actions a strategy can recommend
 * - DecisionAction: CLOSE / OPEN / CLOSE_OPEN — final execution-approved actions
 *
 * @dependencies None
 * @sideEffects None — type definitions only
 */
export enum StrategyAction {
  SKIP = 'skip',
  CLOSE = 'close',
  OPEN = 'open',
  CLOSE_OPEN = 'close+open'
}

export enum DecisionAction {
  CLOSE = 'close',
  OPEN = 'open',
  CLOSE_OPEN = 'close+open'
}
