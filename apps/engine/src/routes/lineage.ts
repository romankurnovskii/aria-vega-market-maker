/**
 * @file lineage.ts
 * @description REST router exposing endpoints for querying position close-to-open succession lineage.
 *
 * @features
 * - GET /lineage — lists all close-to-open position lineage records
 * - GET /lineage/:positionId — returns close-to-open lineage history for a specific position (parent or child)
 *
 * @dependencies express, @lp-system/core (ILineageStore)
 * @sideEffects Reads from lineageStore persistent JSON storage on disk
 */

import { Router } from 'express';
import { ILineageStore } from '@lp-system/core';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('router-lineage');

/**
 * Creates the lineage router exposing succession history queries.
 *
 * @param {ILineageStore} lineageStore - File-based JSON lineage store.
 * @returns {Router} Configured Express router.
 */
export function createLineageRouter(lineageStore: ILineageStore): Router {
  const router = Router();

  /**
   * GET /lineage
   * Returns all recorded close-to-open succession records.
   */
  router.get('/', async (_req, res) => {
    try {
      logger.info('[HTTP Server] Fetching all lineage records...');
      const records = await lineageStore.getLineage();
      res.json({
        count: records.length,
        records,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to fetch lineage records: ${msg}`);
      res.status(500).json({ error: msg });
    }
  });

  /**
   * GET /lineage/:positionId
   * Returns lineage records that involve the specified positionId (either as closedPositionId or newPositionId).
   */
  router.get('/:positionId', async (req, res) => {
    const { positionId } = req.params;
    try {
      logger.info(`[HTTP Server] Fetching lineage records for position ${positionId}...`);
      const records = await lineageStore.getLineageForPosition(positionId);
      res.json({
        positionId,
        count: records.length,
        records,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to fetch lineage records for position ${positionId}: ${msg}`);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}
