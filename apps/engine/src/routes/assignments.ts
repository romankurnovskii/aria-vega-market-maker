import { Router } from 'express';
import { IStore, IOrchestratorRegistry, Assignment, AssignmentMode } from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';

export function createAssignmentsRouter(
  store: IStore,
  registry: IOrchestratorRegistry,
  factory: OrchestratorFactory
): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const assignments = await store.getAssignments();
      res.json(assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  router.post('/', async (req, res) => {
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
        mode: mode as AssignmentMode,
        createdAt: Date.now(),
      };

      await store.saveAssignment(assignment);

      const orchestrator = factory.create(assignment);
      registry.register(orchestrator);

      res.status(201).json({ message: 'Assignment registered successfully', assignment });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await store.deleteAssignment(id);
      registry.deregisterByAssignmentId(id);

      res.json({ message: `Assignment ${id} removed successfully` });
    } catch (error: any) {
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  return router;
}
