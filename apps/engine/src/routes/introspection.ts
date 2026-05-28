/**
 * @file introspection.ts
 * @description Express router exposing system metadata, available strategies, steps, and their documentation.
 *
 * @features
 * - GET /strategies — lists all registered strategies with descriptions
 * - GET /steps — lists all available pipeline steps with documentation
 *
 * @dependencies Express, @lp-system/orchestration
 */

import { Router, Request, Response } from 'express';
import { StepRegistry, DataDrivenStrategy } from '@lp-system/strategy';
import { IStrategyStore, StrategyDefinition } from '@lp-system/core';

/**
 * Creates an Express router to expose system metadata and available components.
 *
 * @param {any} factory - The OrchestratorFactory instance to introspect strategies.
 * @param {StepRegistry} stepRegistry - Global registry of step blocks.
 * @param {IStrategyStore} strategyStore - Store for reading/writing custom user strategies.
 * @returns {Router} Configured Express router.
 */
export function createIntrospectionRouter(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factory: any, // type assertion to bypass cross-package import issues
  stepRegistry: StepRegistry,
  strategyStore: IStrategyStore
): Router {
  const router = Router();

  /**
   * GET /strategies
   * Returns a list of all trading strategies available for assignment in the system.
   */
  router.get('/strategies', (_req, res) => {
    try {
      const strategies = factory.getAvailableStrategies();
      res.json({
        count: strategies.length,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        strategies: strategies.map((s: any) => ({
          id: s.id,
          description: s.description || 'Custom strategy implementation',
        })),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  /**
   * GET /steps
   * Lists the atomic, stateless logical units currently available in the system.
   */
  router.get('/steps', (_req, res) => {
    try {
      res.json({
        availableSteps: stepRegistry.getAllDescriptors(),
        documentation: 'Steps are atomic logical units combined to form strategy workflows.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  /**
   * POST /strategies
   * Saves a new DataDrivenStrategy definition and registers it in the factory.
   */
  router.post('/strategies', async (req: Request, res: Response) => {
    try {
      const definition = req.body as StrategyDefinition;
      if (!definition.id || !definition.steps || !Array.isArray(definition.steps)) {
        res.status(400).json({ error: 'Invalid strategy definition. Must have id and steps array.' });
        return;
      }

      // Save strategy persistence
      await strategyStore.saveStrategy(definition);

      // Register it directly with the factory
      const newStrategy = new DataDrivenStrategy(definition, stepRegistry);
      factory.registerStrategy(newStrategy);

      res.json({ message: 'Strategy registered successfully', strategyId: definition.id });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
