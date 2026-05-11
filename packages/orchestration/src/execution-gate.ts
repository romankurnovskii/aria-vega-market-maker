import { IExecutionGate, Recommendation, Decision } from '@lp-system/core';

export class ExecutionGate implements IExecutionGate {
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
