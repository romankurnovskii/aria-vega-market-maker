/**
 * @file cycleCalculations.ts
 * @description Builds position lifecycle chains (cycles) from flat position and lineage data,
 *              computing aggregate metrics per chain (open/closed amounts, fees, PnL).
 *
 * @features
 * - buildPositionCycles — constructs a Map of CycleMetrics keyed by root position ID
 * - getCycleForPosition — looks up which cycle a given position belongs to
 *
 * @dependencies api types (Position, PositionLineageRecord)
 */

import type { Position, PositionLineageRecord } from '../types/api';

export interface CycleMetrics {
  rootPositionId: string;
  positionsInCycle: Position[];
  amountOpenUsd: number;
  amountClosedUsd: number;
  totalFeesUsd: number;
  totalPnlUsd: number;
  isActive: boolean;
}

/**
 * Builds the position cycles from the flat list of positions and lineage records.
 * Returns a map of cycle metrics keyed by the root position ID.
 */
export const buildPositionCycles = (positions: Position[], lineage: PositionLineageRecord[]): Map<string, CycleMetrics> => {
  const positionMap = new Map<string, Position>();
  for (const pos of positions) {
    positionMap.set(pos.id, pos);
  }

  // Find parents and children
  const parentMap = new Map<string, string>(); // childId -> parentId
  for (const record of lineage) {
    parentMap.set(record.newPositionId, record.closedPositionId);
  }

  // Find root for each position
  const getRoot = (posId: string): string => {
    let current = posId;
    while (parentMap.has(current)) {
      current = parentMap.get(current)!;
    }
    return current;
  };

  const cycles = new Map<string, CycleMetrics>();

  for (const pos of positions) {
    const rootId = getRoot(pos.id);

    if (!cycles.has(rootId)) {
      cycles.set(rootId, {
        rootPositionId: rootId,
        positionsInCycle: [],
        amountOpenUsd: 0,
        amountClosedUsd: 0,
        totalFeesUsd: 0,
        totalPnlUsd: 0,
        isActive: false,
      });
    }

    const cycle = cycles.get(rootId)!;
    cycle.positionsInCycle.push(pos);
    if (pos.state !== 'CLOSED') {
      cycle.isActive = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pnlData = (pos.pnlData || pos.raw || {}) as any;

    // PnL
    if (pnlData.pnlUsd !== undefined) {
      cycle.totalPnlUsd += Number(pnlData.pnlUsd);
    }

    // Amount Open (Initial Deposit)
    // Only count deposits of the root position to represent the "Amount Open" of the cycle
    if (pos.id === rootId && pnlData.allTimeDeposits?.total?.usd !== undefined) {
      cycle.amountOpenUsd = Number(pnlData.allTimeDeposits.total.usd);
    }

    // Total Fees
    // Note: We don't have historical prices here, so we might rely on allTimeFees if available.
    // If not, we fall back to a simple sum of fee usd if present in pnlData
    if (pnlData.allTimeFees?.total?.usd) {
      cycle.totalFeesUsd += Number(pnlData.allTimeFees.total.usd);
    }
  }

  // Sort positions in each cycle by openedAt (oldest first)
  for (const cycle of cycles.values()) {
    cycle.positionsInCycle.sort((a, b) => {
      const aTime = a.openedAt || 0;
      const bTime = b.openedAt || 0;
      return aTime - bTime;
    });

    // Calculate Amount Closed for the cycle:
    // If the cycle is active, the capital is still in play, so cycle Amount Closed is 0.
    // If the cycle is fully closed, the Amount Closed is the value of the last position in the chain.
    if (!cycle.isActive && cycle.positionsInCycle.length > 0) {
      const lastPos = cycle.positionsInCycle[cycle.positionsInCycle.length - 1];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pnlData = (lastPos.pnlData || lastPos.raw || {}) as any;
      const withdrawals = pnlData.allTimeWithdrawals?.total?.usd ? Number(pnlData.allTimeWithdrawals.total.usd) : 0;
      const finalBalances = pnlData.unrealizedPnl?.balances ? Number(pnlData.unrealizedPnl.balances) : 0;
      cycle.amountClosedUsd = withdrawals > 0 ? withdrawals : finalBalances;
    } else {
      cycle.amountClosedUsd = 0;
    }
  }

  return cycles;
};

/**
 * Helper to get the cycle for a specific position.
 */
export const getCycleForPosition = (positionId: string, cycles: Map<string, CycleMetrics>): CycleMetrics | undefined => {
  for (const cycle of cycles.values()) {
    if (cycle.positionsInCycle.some((p) => p.id === positionId)) {
      return cycle;
    }
  }
  return undefined;
};
