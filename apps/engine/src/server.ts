import express from 'express';
import cors from 'cors';
import { IStore, IOrchestratorRegistry, IExecutor, Assignment, IPositionProvider } from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';

export function startHttpServer(
  store: IStore,
  registry: IOrchestratorRegistry,
  executor: IExecutor,
  factory: OrchestratorFactory,
  positionProvider: IPositionProvider
): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  // GET /assignments - lists assignments from persistent store
  app.get('/assignments', async (_req, res) => {
    try {
      const assignments = await store.getAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // POST /assignments - creates a new assignment, persists, registers orchestrator
  app.post('/assignments', async (req, res) => {
    try {
      const { id, strategyId, positionId, mode } = req.body;

      if (!id || !strategyId || !positionId || !mode) {
        res.status(400).json({ error: 'Missing required parameters: id, strategyId, positionId, mode' });
        return;
      }

      const assignment: Assignment = {
        id,
        strategyId,
        positionId,
        mode: mode as 'active' | 'monitoring',
        createdAt: Date.now()
      };

      // 1. Persist to store
      await store.saveAssignment(assignment);

      // 2. Create orchestrator and register
      const orchestrator = factory.create(assignment);
      registry.register(orchestrator);

      res.status(201).json({ message: 'Assignment registered successfully', assignment });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // DELETE /assignments/:id - deletes assignment, deregisters orchestrator
  app.delete('/assignments/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // 1. Delete from persistent store
      await store.deleteAssignment(id);

      // 2. Deregister from memory registry
      const orchId = `orch_${id}`;
      registry.deregister(orchId);

      res.json({ message: `Assignment ${id} removed successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // POST /strategies/:id/evaluate - runs strategy ad-hoc for a given position
  app.post('/strategies/:id/evaluate', async (req, res) => {
    try {
      const { id: strategyId } = req.params;
      const { positionId } = req.body;

      if (!positionId) {
        res.status(400).json({ error: 'Missing positionId in request body' });
        return;
      }

      console.log(`[HTTP Server] Triggering manual ad-hoc strategy evaluation for ${strategyId} on position ${positionId}`);
      
      const position = await positionProvider.getPosition(positionId);
      const market = await positionProvider.getMarketSnapshot(position.poolAddress);
      
      const orchestrators = registry.getForPosition(positionId);
      const targetOrch = orchestrators.find((o) => o.strategyId === strategyId);

      if (!targetOrch) {
        res.status(404).json({ error: `No active orchestrator for strategy ${strategyId} and position ${positionId} exists in registry` });
        return;
      }

      const result = await targetOrch.tick(position, market);
      res.json({ status: 'success', result });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: Date.now() });
  });

  app.listen(PORT, () => {
    console.log(`[HTTP Server] Operational and listening on port ${PORT} (loaded: ${executor.constructor.name})`);
  });

  return app;
}
