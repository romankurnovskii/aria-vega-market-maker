/**
 * @file strategy-reassignment.ts
 * @description Service helper to handle strategy reassignment and lineage tracking during close+open rebalances.
 *
 * @features
 * - Creates a new active Assignment for a newly opened position
 * - Persists the new Assignment and registers a new StrategyOrchestrator in-memory
 * - Deletes the old Assignment and deregisters the old Orchestrator cleanly
 * - Persists a PositionLineageRecord linking the closed position to the new position
 *
 * @dependencies node:crypto, @lp-system/core, @lp-system/orchestration, @lp-system/logger
 * @sideEffects Mutates the persistent assignment store, lineage store, and in-memory orchestrator registry
 */

import * as crypto from 'node:crypto';
import { IStore, IOrchestratorRegistry, ILineageStore, Assignment, PositionLineageRecord } from '@lp-system/core';
import { OrchestratorFactory } from '@lp-system/orchestration';
import { getLogger } from '@lp-system/logger';

const logger = getLogger('strategy-reassignment');

/**
 * Parameter interface for handleReassignStrategy function.
 */
interface ReassignStrategyParams {
  oldPositionId: string;
  newPositionId: string;
  poolAddress: string;
  strategyId: string;
  oldAssignmentId: string;
  closeTxSignature: string;
  openTxSignature: string;
  store: IStore;
  registry: IOrchestratorRegistry;
  factory: OrchestratorFactory;
  lineageStore: ILineageStore;
}

/**
 * Transition a strategy assignment from an old position to a newly opened position,
 * updating the local store, the in-memory registry, and saving a lineage audit record.
 *
 * @param {ReassignStrategyParams} params - Configuration and dependencies for the reassignment.
 * @returns {Promise<Assignment>} The newly created assignment record.
 */
export async function handleReassignStrategy({
  oldPositionId,
  newPositionId,
  poolAddress,
  strategyId,
  oldAssignmentId,
  closeTxSignature,
  openTxSignature,
  store,
  registry,
  factory,
  lineageStore,
}: ReassignStrategyParams): Promise<Assignment> {
  const timestamp = Date.now();
  const newAssignmentId = `asg_${crypto.randomUUID()}`;

  logger.info(
    `[StrategyReassignment] Initiating transition from ${oldPositionId} to ${newPositionId} for strategy ${strategyId}`
  );

  // 1. Create new assignment
  const newAssignment: Assignment = {
    id: newAssignmentId,
    strategyId,
    positionId: newPositionId,
    mode: 'active',
    createdAt: timestamp,
  };

  // 2. Persist the new assignment
  await store.saveAssignment(newAssignment);
  logger.info(`[StrategyReassignment] Persisted new assignment ${newAssignmentId} for position ${newPositionId}`);

  // 3. Create and register the new orchestrator
  try {
    const newOrchestrator = factory.create(newAssignment);
    registry.register(newOrchestrator);
    logger.info(`[StrategyReassignment] Created and registered orchestrator for position ${newPositionId}`);
  } catch (err) {
    logger.error(`[StrategyReassignment] Failed to register new orchestrator for ${newPositionId}:`, err);
    // Continue so we don't break the return, but it is an error state
  }

  // 4. Save the lineage record linking old and new positions
  const lineageRecord: PositionLineageRecord = {
    closedPositionId: oldPositionId,
    newPositionId,
    poolAddress,
    strategyId,
    closedAt: timestamp,
    openedAt: timestamp,
    oldAssignmentId,
    newAssignmentId,
    closeTxSignature,
    openTxSignature,
  };

  try {
    await lineageStore.saveLineageRecord(lineageRecord);
    logger.info(`[StrategyReassignment] Position lineage recorded: ${oldPositionId} -> ${newPositionId}`);
  } catch (err) {
    logger.error(`[StrategyReassignment] Failed to save lineage record:`, err);
  }

  // 5. Clean up the old assignment and orchestrator
  try {
    await store.deleteAssignment(oldAssignmentId);
    logger.info(`[StrategyReassignment] Deleted old assignment ${oldAssignmentId}`);
  } catch (err) {
    logger.warn(`[StrategyReassignment] Failed to delete old assignment ${oldAssignmentId} from store:`, err);
  }

  try {
    registry.deregisterByAssignmentId(oldAssignmentId);
    logger.info(`[StrategyReassignment] Deregistered old orchestrator for assignment ${oldAssignmentId}`);
  } catch (err) {
    logger.warn(`[StrategyReassignment] Failed to deregister old orchestrator for assignment ${oldAssignmentId}:`, err);
  }

  return newAssignment;
}
