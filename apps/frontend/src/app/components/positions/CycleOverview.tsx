/**
 * @file CycleOverview.tsx
 * @description Presentational component that visualizes a position lifecycle chain (cycle)
 *              with a timeline of all positions in the chain and aggregate metrics.
 *
 * @features
 * - Displays cycle timeline: root position creation, chain length, active/closed state
 * - Shows aggregate metrics: amount open, amount closed, total fees, total PnL
 * - Renders indicator badges for active vs closed cycles
 *
 * @dependencies cycleCalculations types, format utils
 */

import React from 'react';
import type { CycleMetrics } from '../../utils/cycleCalculations';
import { getTokenSymbol } from '../../utils/format';

interface Props {
  cycle: CycleMetrics;
  onSelectPosition?: (id: string) => void;
  currentPositionId: string;
}

export const CycleOverview = ({ cycle, onSelectPosition, currentPositionId }: Props) => {
  if (!cycle || cycle.positionsInCycle.length <= 1) {
    return null; // Don't show cycle overview if it's just a single position
  }

  const formatUsd = (val: number) => {
    return `${val >= 0 ? '+' : ''}$${Math.abs(val).toFixed(2)}`;
  };

  return (
    <div className="mt-4 border border-[#0D0D0D] bg-[#F4F4F0] p-4 flex flex-col gap-3">
      <h3 className="font-syne text-sm font-bold uppercase border-b border-gray-300 pb-2">Full Cycle Overview</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Amount Open</div>
          <div className="font-mono text-sm font-bold">${cycle.amountOpenUsd.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Amount Closed</div>
          <div className="font-mono text-sm font-bold">${cycle.amountClosedUsd.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Fees Gained</div>
          <div className="font-mono text-sm font-bold text-green-600">${cycle.totalFeesUsd.toFixed(4)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Cycle PnL</div>
          <div className={`font-mono text-sm font-bold ${cycle.totalPnlUsd >= 0 ? 'text-green-600' : 'text-[#FF4500]'}`}>
            {formatUsd(cycle.totalPnlUsd)}
          </div>
        </div>
      </div>

      <div className="mt-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Positions in Cycle</div>
        <div className="flex flex-col gap-1">
          {cycle.positionsInCycle.map((pos, index) => {
            const isCurrent = pos.id === currentPositionId;
            const openedAtDate = pos.openedAt ? new Date(pos.openedAt) : null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const raw = (pos.raw as any) || {};
            const closedAtDate = raw.closedAt ? new Date(raw.closedAt) : null;

            const formatTime = (d: Date | null) =>
              d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---';
            const durationMs = openedAtDate && closedAtDate ? closedAtDate.getTime() - openedAtDate.getTime() : null;
            let durationStr = '---';
            if (durationMs !== null) {
              const mins = Math.floor(durationMs / 60000);
              const hrs = Math.floor(mins / 60);
              if (hrs > 0) durationStr = `${hrs}h ${mins % 60}m`;
              else durationStr = `${mins}m`;
            }

            const pnlData = pos.pnlData || raw.pnlData || raw || {};
            const pnlUsd = pnlData.pnlUsd !== undefined ? Number(pnlData.pnlUsd) : 0;

            const openUsd =
              pnlData.allTimeDeposits?.total?.usd !== undefined
                ? Number(pnlData.allTimeDeposits.total.usd).toFixed(2)
                : '0.00';

            let closeUsd = '0.00';
            if (pos.state === 'CLOSED') {
              if (pnlData.allTimeWithdrawals?.total?.usd && Number(pnlData.allTimeWithdrawals.total.usd) > 0) {
                closeUsd = Number(pnlData.allTimeWithdrawals.total.usd).toFixed(2);
              } else if (pnlData.unrealizedPnl?.balances !== undefined) {
                closeUsd = Number(pnlData.unrealizedPnl.balances).toFixed(2);
              }
            }

            const tokenXSym = pos.tokenX ? getTokenSymbol(pos.tokenX) : 'X';
            const tokenYSym = pos.tokenY ? getTokenSymbol(pos.tokenY) : 'Y';

            return (
              <div
                key={pos.id}
                className={`flex flex-col gap-1 text-[12px] font-mono p-2 border-b border-gray-200 last:border-0 ${isCurrent ? 'bg-gray-200 font-bold' : 'hover:bg-gray-100 cursor-pointer text-gray-600'}`}
                onClick={() => {
                  if (!isCurrent && onSelectPosition) {
                    onSelectPosition(pos.id);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="w-4 text-[12px] text-gray-400">{index + 1}.</span>
                  <span className="text-[12px]" title={pos.id}>
                    {pos.id}
                  </span>
                  <span
                    className={`text-[12px] uppercase px-1 rounded ${pos.state === 'CLOSED' ? 'bg-gray-300' : 'bg-green-200 text-green-800'}`}
                  >
                    {pos.state}
                  </span>
                  {isCurrent && <span className="text-[12px] text-[#FF4500]">Current</span>}

                  <span className="ml-auto text-[12px] whitespace-nowrap">
                    PnL: <span className={pnlUsd >= 0 ? 'text-green-600' : 'text-[#FF4500]'}>{formatUsd(pnlUsd)}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 ml-6 text-gray-500">
                  <span>
                    Range: ${pos.lowerBoundPrice !== undefined ? Number(pos.lowerBoundPrice).toFixed(2) : '---'}–$
                    {pos.upperBoundPrice !== undefined ? Number(pos.upperBoundPrice).toFixed(2) : '---'}
                  </span>
                  <span>Open: {formatTime(openedAtDate)}</span>
                  <span>Close: {formatTime(closedAtDate)}</span>
                  <span>Duration: {durationStr}</span>
                  <span>Amount Open: ${openUsd}</span>
                  {pos.state === 'CLOSED' && <span>Amount Closed: ${closeUsd}</span>}
                  <span className="opacity-70">
                    ({tokenXSym} / {tokenYSym})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
