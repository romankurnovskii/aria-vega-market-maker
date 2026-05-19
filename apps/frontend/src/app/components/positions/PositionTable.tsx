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
import type { Position } from '../../types/api';

interface PositionTableProps {
  positions: Position[];
  positionOrchestration: Record<string, { strategyId: string; mode: string }>;
  selectedPosId: string | null;
  onSelect: (id: string | null) => void;
  onOpenPositionClick?: () => void;
}

export const PositionTable = ({
  positions,
  positionOrchestration,
  selectedPosId,
  onSelect,
  onOpenPositionClick,
}: PositionTableProps) => {
  const openPositions = positions.filter((pos: Position) => pos.state !== 'CLOSED');
  const closedPositions = positions.filter((pos: Position) => pos.state === 'CLOSED');

  const renderSectionHeader = (label: string, count: number) => (
    <tr className="bg-[#0D0D0D] text-[#F4F4F0] block md:table-row">
      <td colSpan={5} className="py-1.5 px-3 font-bold uppercase tracking-widest text-sm block md:table-cell">
        {label} ({count})
      </td>
    </tr>
  );

  const addrShort = (addr: string, len = 4) => `${addr.slice(0, len)}...${addr.slice(-len)}`;

  const tokenSymbol = (mint?: string): string => {
    if (!mint) return '?';
    if (mint === 'So11111111111111111111111111111111111111112') return 'SOL';
    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 'USDC';
    if (mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') return 'USDT';
    return mint.slice(0, 4).toUpperCase();
  };

  const poolName = (pos: Position): string => {
    const x = pos.tokenX?.mint || pos.tokenX?.tokenAddress;
    const y = pos.tokenY?.mint || pos.tokenY?.tokenAddress;
    if (!x || !y) return '?';
    return `${tokenSymbol(x)}-${tokenSymbol(y)}`;
  };

  const renderRow = (pos: Position, dimmed = false) => {
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
        className={`border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors cursor-pointer flex flex-col md:table-row ${isSelected ? 'bg-[#E5E5DF]' : ''} ${dimmed ? 'opacity-60' : ''}`}
      >
        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 font-bold flex items-center gap-2 justify-between md:justify-start block md:table-cell">
          <div className="flex items-center gap-2">
            {isSelected && <ChevronRight size={12} className="text-[#FF4500]" />}
            <span className="font-mono" title={pos.id}>
              {addrShort(pos.id, 6)}
            </span>
          </div>
          {pos.state && pos.state !== 'OPEN' && (
            <span
              className={`text-[13px] px-1 py-0.5 border scale-90 tracking-wide font-mono ${
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
        <td className="py-2 px-3 text-[13px] font-mono text-gray-500 block md:table-cell" title={pos._wallet}>
          <span className="md:hidden text-gray-500 mr-2">Wallet:</span>
          {pos._wallet ? addrShort(pos._wallet) : '-'}
        </td>
        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 text-gray-600 block md:table-cell" title={pos.pool}>
          <span className="md:hidden text-gray-500 mr-2">Pool:</span>
          <span className="font-semibold">{poolName(pos)}</span>{' '}
          <span className="text-[13px] text-gray-400 font-mono">{addrShort(pos.pool, 4)}</span>
        </td>
        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 block md:table-cell">
          <span className="md:hidden text-gray-500 mr-2">Range:</span>
          <span
            className={pos.status === 'In Range' ? 'text-green-600 cursor-help' : 'text-[#FF4500] cursor-help'}
            title={`Bins: ${pos.minBin} to ${pos.maxBin}`}
          >
            {pos.binCount} bins
            {(pos.lowerBoundPrice || pos.upperBoundPrice) && (
              <>
                {' '}
                | ${Number(pos.lowerBoundPrice).toFixed(2)}–${Number(pos.upperBoundPrice).toFixed(2)}
              </>
            )}{' '}
            <span className="text-[13px] opacity-70">({Number(pos.rangePercent).toFixed(2)}%)</span>
          </span>
        </td>
        <td className={`py-2 px-3 text-left md:text-right ${orchClass} block md:table-cell`}>
          <span className="md:hidden text-gray-500 mr-2">State:</span>
          {orchLabel}
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-full border border-[#0D0D0D] bg-white overflow-hidden">
      <div className="p-2 border-b border-[#0D0D0D] flex justify-between items-center bg-[#F4F4F0]">
        <h3 className="font-syne text-sm font-bold uppercase">Positions</h3>
        <button
          onClick={onOpenPositionClick}
          className="px-2 py-1 border border-[#0D0D0D] text-sm uppercase hover:bg-[#0D0D0D] hover:text-[#F4F4F0] transition-colors font-mono"
        >
          + Open Position
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {positions.length === 0 ? (
          <div className="p-4 text-sm italic text-gray-500">
            No active positions fetched. Confirm liquidity provider assignments are running on-chain.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm md:whitespace-nowrap block md:table">
            <thead className="sticky top-0 bg-[#0D0D0D] text-[#F4F4F0] z-10 shadow-[0_1px_0_#0D0D0D] hidden md:table-header-group">
              <tr>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Pos ID</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Wallet</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Target Pool</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Range</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">
                  State
                </th>
              </tr>
            </thead>
            <tbody className="block md:table-row-group">
              {openPositions.length > 0 && renderSectionHeader('Open / Active', openPositions.length)}
              {openPositions.map((pos: Position) => renderRow(pos))}
              {closedPositions.length > 0 && renderSectionHeader('Closed', closedPositions.length)}
              {closedPositions.map((pos: Position) => renderRow(pos, true))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
