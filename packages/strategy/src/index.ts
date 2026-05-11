/**
 * @file index.ts
 * @description Public API surface for the @lp-system/strategy package.
 *
 * @features
 * - Re-exports Workflow (pipeline orchestration) and TrailingUsdcStrategy (concrete strategy implementation)
 *
 * @dependencies None
 * @sideEffects None
 */
export { Workflow } from './workflow.js';
export { TrailingUsdcStrategy } from './trailing-usdc-strategy.js';
