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
import {
  IStrategyStore,
  StrategyDefinition,
  StrategyDefinitionStep,
  IPositionProvider,
  Position,
  PipelineContext,
} from '@lp-system/core';
import { getMarketSnapshot } from '@lp-system/providers';

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
  strategyStore: IStrategyStore,
  positionProvider?: IPositionProvider
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

  /**
   * POST /strategies/simulate
   * Simulates a StrategyDefinition against mock or real position data and returns a step-by-step trace.
   */
  router.post('/strategies/simulate', async (req: Request, res: Response) => {
    try {
      const { definition, poolAddress, positionId } = req.body;
      // Validate required pool address for real market data
      if (!poolAddress) {
        res.status(400).json({ error: 'poolAddress is required for simulation' });
        return;
      }
      if (!definition || !definition.steps) {
        res.status(400).json({ error: 'Missing strategy definition' });
        return;
      }

      let position: Position;
      if (positionId && positionProvider) {
        position = await positionProvider.getPosition(positionId, poolAddress);
      } else {
        // Minimal placeholder position; expect ContextSetupStep to populate amounts
        position = {
          id: positionId || 'placeholder-position',
          poolAddress,
          tokenX: { amount: '0', decimals: 6, tokenAddress: '' },
          tokenY: { amount: '0', decimals: 6, tokenAddress: '' },
          state: 'OPEN',
        } as unknown as Position;
      }

      // Fetch real market snapshot; propagate errors to caller
      const market = await getMarketSnapshot(poolAddress);

      const steps = definition.steps.map((s: StrategyDefinitionStep) => stepRegistry.create(s.stepId, s.params));

      let context: PipelineContext = {
        position,
        market,
        params: definition.defaultParams || {},
      };

      const trace: Record<string, unknown>[] = [];

      for (const step of steps) {
        const contextBefore = JSON.parse(JSON.stringify(context));
        try {
          context = (await step.execute(context)) as PipelineContext;
        } catch (stepError: unknown) {
          const errMsg = stepError instanceof Error ? stepError.message : String(stepError);
          trace.push({
            stepId: step.descriptor?.id || step.name,
            stepName: step.descriptor?.name || step.name,
            contextBefore,
            error: errMsg,
          });
          // Return immediately with the trace so far and the error
          res.json({ result: context, trace, error: errMsg });
          return;
        }

        const contextAfter = JSON.parse(JSON.stringify(context));
        trace.push({
          stepId: step.descriptor?.id || step.name,
          stepName: step.descriptor?.name || step.name,
          contextBefore,
          contextAfter,
        });

        if (context._halted) {
          break;
        }
      }

      res.json({ result: context, trace });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
