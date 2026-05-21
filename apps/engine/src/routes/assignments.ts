/**
 * @file assignments.ts
 * @description Express router for CRUD operations on strategy-to-position assignments.
 *              Supports create, list, and delete of assignments via REST endpoints.
 *
 * @features
 * - POST / — creates a new assignment (strategy + position binding)
 * - GET / — lists all current assignments
 * - DELETE /:id — removes an assignment by ID
 *
 * @dependencies Express, @lp-system/core (IStore), @lp-system/orchestration
 * @sideEffects Modifies assignment state in the IStore
 */

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await store.deleteAssignment(id);
      registry.deregisterByAssignmentId(id);

      res.json({ message: `Assignment ${id} removed successfully` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  });

  return router;
}
