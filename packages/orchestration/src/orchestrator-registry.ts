/**
 * @file orchetrator-registry.ts
 * @description In-memory registry for active orchestrator instances, managing lifecycle and lookup.
 *
 * @features
 * - Register/deregister orchestrators by ID
 * - Retrieve all orchestrators for a given position (multi-strategy scenarios)
 * - Singleton lookup by ID and bulk enumeration
 *
 * @dependencies IOrchestrator (from @lp-system/core)
 * @sideEffects None — pure in-memory store, no persistence
 */
import { IOrchestratorRegistry, IOrchestrator } from '@lp-system/core';

/**
 * OrchestratorRegistry: in-memory Map-based registry for orchestrator lifecycle.
 */
import { getLogger } from '@lp-system/logger';
const logger = getLogger('orchestrator-registry');

export class OrchestratorRegistry implements IOrchestratorRegistry {
  private registry = new Map<string, IOrchestrator>();

  /**
   * Registers a new orchestrator instance.
   *
   * @param {IOrchestrator} orchestrator - The orchestrator to register.
   */
  public register(orchestrator: IOrchestrator): void {
    logger.info(
      `[OrchestratorRegistry] Registering orchestrator ${orchestrator.id} for position ${orchestrator.positionId}`
    );
    this.registry.set(orchestrator.id, orchestrator);
  }

  /**
   * Deregisters an orchestrator by ID.
   *
   * @param {string} id - Orchestrator ID to remove.
   */
  public deregister(id: string): void {
    const existing = this.registry.get(id);
    if (existing) {
      logger.info(
        `[OrchestratorRegistry] Deregistering orchestrator ${id} from position ${existing.positionId}`
      );
      this.registry.delete(id);
    }
  }

  /**
   * Deregisters an orchestrator by its assignmentId.
   *
   * @param {string} assignmentId - Assignment ID to look up and remove.
   */
  public deregisterByAssignmentId(assignmentId: string): void {
    for (const [id, orch] of this.registry.entries()) {
      if (orch.assignmentId === assignmentId) {
        logger.info(
          `[OrchestratorRegistry] Deregistering orchestrator ${id} (assignment ${assignmentId}) from position ${orch.positionId}`
        );
        this.registry.delete(id);
        return;
      }
    }
    logger.warn(
      `[OrchestratorRegistry] No registered orchestrator found for assignmentId ${assignmentId}`
    );
  }

  /**
   * Returns all orchestrators currently managing a specific position.
   *
   * @param {string} positionId - Position to query.
   * @returns {IOrchestrator[]} Array of matching orchestrators.
   */
  public getForPosition(positionId: string): IOrchestrator[] {
    const list: IOrchestrator[] = [];
    for (const orch of this.registry.values()) {
      if (orch.positionId === positionId) {
        list.push(orch);
      }
    }
    return list;
  }

  /**
   * Returns a single orchestrator by ID, or undefined if not found.
   *
   * @param {string} id - Orchestrator ID to look up.
   * @returns {IOrchestrator | undefined}
   */
  public get(id: string): IOrchestrator | undefined {
    return this.registry.get(id);
  }

  /**
   * Returns all registered orchestrators.
   *
   * @returns {IOrchestrator[]} Snapshot of current registry contents.
   */
  public getAll(): IOrchestrator[] {
    return Array.from(this.registry.values());
  }
}
