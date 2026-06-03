/**
 * @file default-registry.ts
 * @description Factory function that creates a StepRegistry pre-populated with all built-in steps.
 *
 * @features
 * - Single source of truth for all step registrations
 * - Consumed by TrailingUsdcStrategy, ExperimentalRestakeStrategy, and the engine main.ts
 * - Eliminates duplicate per-strategy registry bootstrapping
 *
 * @dependencies @lp-system/steps, StepRegistry
 */
import {
  InitializationCheckStep,
  TrailingRangeCheckStep,
  RangeCalculatorStep,
  AmountCalculatorStep,
  ClmmPricingStep,
  ExperimentalRestakeStep,
  ConditionDecisionStep,
  ContextSetupStep,
} from '@lp-system/steps';
import { StepRegistry } from './step-registry.js';

/**
 * Creates a new StepRegistry pre-populated with all available built-in step types.
 * Call this when constructing a standalone strategy or during engine bootstrap.
 *
 * @returns {StepRegistry} A fully populated registry instance.
 */
export function createDefaultRegistry(): StepRegistry {
  const registry = new StepRegistry();

  registry.register('initialization-check', () => new InitializationCheckStep(), new InitializationCheckStep().descriptor);
  registry.register('trailing-range-check', () => new TrailingRangeCheckStep(), new TrailingRangeCheckStep().descriptor);
  registry.register('range-calculator', () => new RangeCalculatorStep(), new RangeCalculatorStep().descriptor);
  registry.register(
    'amount-calculator',
    (params) => new AmountCalculatorStep(params),
    new AmountCalculatorStep().descriptor
  );
  registry.register('clmm-pricing', () => new ClmmPricingStep(), new ClmmPricingStep().descriptor);
  registry.register('experimental-restake', () => new ExperimentalRestakeStep(), new ExperimentalRestakeStep().descriptor);
  registry.register(
    'condition-decision',
    (params) => new ConditionDecisionStep(params),
    new ConditionDecisionStep().descriptor
  );
  registry.register('context-setup', (params) => new ContextSetupStep(params), new ContextSetupStep().descriptor);

  return registry;
}
