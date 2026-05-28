/**
 * @file step-registry.ts
 * @description Central registry for available strategy pipeline steps.
 *
 * @features
 * - Registers step constructors by ID
 * - Instantiates steps with given parameters
 * - Retrieves descriptors for all registered steps (for GUI builder)
 *
 * @dependencies IStep, StepDescriptor (from @lp-system/core)
 * @sideEffects None
 */
import { IStep, StepDescriptor } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('step-registry');

// A factory function type for creating steps
export type StepFactory = (params?: Record<string, unknown>) => IStep;

export class StepRegistry {
  private factories = new Map<string, StepFactory>();
  private descriptors = new Map<string, StepDescriptor>();

  /**
   * Register a step type with its factory and descriptor.
   *
   * @param id The unique identifier of the step type.
   * @param factory Function to instantiate the step.
   * @param descriptor Metadata describing the step.
   */
  public register(id: string, factory: StepFactory, descriptor: StepDescriptor): void {
    if (this.factories.has(id)) {
      logger.warn(`[StepRegistry] Overwriting existing step registration for ID: ${id}`);
    }
    this.factories.set(id, factory);
    this.descriptors.set(id, descriptor);
    logger.debug(`[StepRegistry] Registered step: ${id}`);
  }

  /**
   * Instantiate a new step by its ID.
   *
   * @param id The step type identifier.
   * @param params Optional parameters to pass to the step constructor.
   * @returns A new instance of the step.
   * @throws Error if the step ID is not registered.
   */
  public create(id: string, params: Record<string, unknown> = {}): IStep {
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`Step with ID '${id}' is not registered`);
    }
    return factory(params);
  }

  /**
   * Retrieve descriptors for all registered steps.
   * Useful for a GUI builder to show available blocks.
   *
   * @returns Array of step descriptors.
   */
  public getAllDescriptors(): StepDescriptor[] {
    return Array.from(this.descriptors.values());
  }

  /**
   * Get the descriptor for a specific step ID.
   *
   * @param id The step type identifier.
   * @returns The step descriptor, or undefined if not found.
   */
  public getDescriptor(id: string): StepDescriptor | undefined {
    return this.descriptors.get(id);
  }
}
