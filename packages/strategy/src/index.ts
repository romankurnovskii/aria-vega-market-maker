/**
 * @file index.ts
 * @description Public API surface for the @lp-system/strategy package.
 *
 * @features
 * - Re-exports Workflow (pipeline orchestration), StepRegistry, and DataDrivenStrategy
 *
 * @dependencies None
 * @sideEffects None
 */
import { getLogger } from '@lp-system/logger';
const logger = getLogger('strategy');
logger.info('Strategy package loaded');
export { Workflow } from './workflow.js';
export { StepRegistry, StepFactory } from './step-registry.js';
export { DataDrivenStrategy } from './data-driven-strategy.js';
export { createDefaultRegistry } from './default-registry.js';
