/**
 * @file execution-gate.ts
 * @description Decision filtering and prioritization gate that selects which strategy recommendation to execute.
 *
 * @features
 * - Filters empty recommendation sets → null decision
 * - Prioritizes signals: close+open (rebalance) > close > open
 * - Returns first matching high priority recommendation with normalized action and open params
 *
 * @dependencies Recommendation[], Decision (from core types)
 * @sideEffects None — pure function style class with no local state mutation
 */
import { IExecutionGate, Recommendation, Decision } from '@lp-system/core';

/**
 * ExecutionGate: filters and prioritizes strategy recommendations into executable decisions.
 */
export class ExecutionGate implements IExecutionGate {
  /**
   * Evaluates recommendations and returns highest priority actionable decision, or null.
   *
   * Priority order (highest to lowest): close+open → close → open.
   *
   * @param {Recommendation[]} recommendations - All active strategy results for a position.
   * @param {string} positionId - The position being evaluated.
   * @returns {Decision | null} Approved decision with normalized action and openParams, or null if none actionable.
   */
  public consider(recommendations: Recommendation[], positionId: string): Decision | null {
    if (recommendations.length === 0) {
      return null;
    }

    console.log(`[ExecutionGate] Evaluating ${recommendations.length} recommendations for position ${positionId}`);

    // Prioritize rebalance signals ('close+open'), then 'close', then 'open'
    const actionablePriorities = ['close+open', 'close', 'open'] as const;

    for (const priorityAction of actionablePriorities) {
      const match = recommendations.find((rec) => rec.result.action === priorityAction);
      if (match) {
        const action = match.result.action as 'close' | 'open' | 'close+open';
        const openParams =
          match.result.action === 'close+open'
            ? match.result.openParams
            : match.result.action === 'open'
            ? match.result.params
            : undefined;

        console.log(`[ExecutionGate] Decision Gated: Approved '${action}' triggered by assignment ${match.assignmentId}`);

        return {
          positionId,
          action,
          openParams,
          sourceAssignmentId: match.assignmentId,
          evaluatedAt: Date.now()
        };
      }
    }

    return null;
  }
}
