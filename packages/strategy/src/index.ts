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
import { getLogger } from '@lp-system/logger';
const logger = getLogger('strategy');
logger.info('Strategy package loaded');
export { Workflow } from './workflow.js';
export { TrailingUsdcStrategy } from './trailing-usdc-strategy.js';
export { ExperimentalRestakeStrategy } from './experimental-restake-strategy.js';
export { StepRegistry, StepFactory } from './step-registry.js';
export { DataDrivenStrategy } from './data-driven-strategy.js';
