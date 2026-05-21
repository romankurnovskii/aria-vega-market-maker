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

import { Router } from 'express';
import { OrchestratorFactory } from '@lp-system/orchestration';

/**
 * Creates an Express router to expose system metadata and available components.
 *
 * @param {OrchestratorFactory} factory - The OrchestratorFactory instance to introspect strategies.
 * @returns {Router} Configured Express router.
 */
export function createIntrospectionRouter(factory: OrchestratorFactory): Router {
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
        strategies: strategies.map((s) => ({
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
        availableSteps: ['InitializationCheckStep', 'TrailingRangeCheckStep', 'RangeCalculatorStep', 'AmountCalculatorStep'],
        documentation: 'Steps are atomic logical units combined to form strategy workflows.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
