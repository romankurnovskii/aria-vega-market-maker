/**
 * @file PositionTable.tsx
 * @description Dumb component rendering the scrollable table of on-chain positions.
 *              Handles row selection via callback — owns no fetch or business logic.
 *
 * @features
 * - Renders sticky-header table with ID, pool, range, state, and orchestration status columns
 * - Highlights the selected row and shows an active indicator for assigned positions
 * - Color-codes orchestration mode labels (active/green, monitor/yellow, unassigned/gray)
 *
 * @sideEffects None
 */

'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PositionTableProps {
  positions: any[];
  positionOrchestration: Record<string, { strategyId: string; mode: string }>;
  selectedPosId: string | null;
  onSelect: (id: string | null) => void;
}

export const PositionTable = ({ positions, positionOrchestration, selectedPosId, onSelect }: PositionTableProps) => {
  return (
    <div
      className={`flex flex-col border border-[#0D0D0D] bg-white transition-all duration-300 ${selectedPosId ? 'hidden lg:flex lg:w-7/12' : 'w-full h-full'}`}
    >
      <div className="flex-1 overflow-auto">
        {positions.length === 0 ? (
          <div className="p-4 text-xs italic text-gray-500">
            No active positions fetched. Confirm liquidity provider assignments are running on-chain.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="sticky top-0 bg-[#0D0D0D] text-[#F4F4F0] z-10 shadow-[0_1px_0_#0D0D0D]">
              <tr>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Pos ID</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Target Pool</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Range</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">
                  State
                </th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos: any) => {
                const orch = positionOrchestration[pos.id];
                const orchLabel = orch ? orch.mode.toUpperCase() : 'UNASSIGNED';
                const orchClass =
                  orch?.mode === 'active'
                    ? 'text-green-600 font-bold'
                    : orch?.mode === 'monitor'
                      ? 'text-yellow-600 font-bold'
                      : 'text-gray-400';
                const isSelected = selectedPosId === pos.id;

                return (
                  <tr
                    key={pos.id}
                    onClick={() => onSelect(pos.id)}
                    className={`border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors cursor-pointer ${isSelected ? 'bg-[#E5E5DF]' : ''}`}
                  >
                    <td className="py-2 px-3 border-r border-gray-200 font-bold flex items-center gap-2">
                      {isSelected && <ChevronRight size={12} className="text-[#FF4500]" />}
                      <span className="font-mono" title={pos.id}>
                        {pos.id}
                      </span>
                      {pos.state && pos.state !== 'OPEN' && (
                        <span
                          className={`text-[11px] px-1 py-0.5 border scale-90 tracking-wide font-mono ${
                            pos.state === 'REBALANCING'
                              ? 'border-yellow-500 text-yellow-600 animate-pulse bg-yellow-50'
                              : pos.state === 'CLOSING'
                                ? 'border-orange-500 text-orange-600 animate-pulse bg-orange-50'
                                : pos.state === 'CREATING'
                                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                                  : 'border-red-500 text-red-600 bg-red-50'
                          }`}
                        >
                          {pos.state}
                        </span>
                      )}
                    </td>
                    <td
                      className="py-2 px-3 border-r border-gray-200 truncate max-w-[120px] text-gray-600"
                      title={pos.pool}
                    >
                      {pos.pool}
                    </td>
                    <td className="py-2 px-3 border-r border-gray-200">
                      <span
                        className={pos.status === 'In Range' ? 'text-green-600 cursor-help' : 'text-[#FF4500] cursor-help'}
                        title={`Bins: ${pos.minBin} to ${pos.maxBin}`}
                      >
                        {pos.binCount} bins ({Number(pos.rangePercent).toFixed(1)}%)
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right ${orchClass}`}>{orchLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};