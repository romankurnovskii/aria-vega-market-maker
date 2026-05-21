/**
 * @file PositionTable.tsx
 * @description Presentational component that renders a sortable, selectable table of positions
 *              with pool name, price range, status badges, and token balances.
 *
 * @features
 * - Renders a row per position with pool name, price range, status, balances
 * - Highlights selected position with active styling
 * - Handles empty state with a placeholder message
 * - Delegates detailed view to PositionDetail on row click
 *
 * @dependencies format utils, api types
 */

'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatAmount, getTokenSymbol } from '../../utils/format';
import type { CycleMetrics } from '../../utils/cycleCalculations';
import type { Position } from '../../types/api';

interface PositionTableProps {
  positions: Position[];
  positionOrchestration: Record<string, { strategyId: string; mode: string }>;
  cycles?: Map<string, CycleMetrics>;
  selectedPosId: string | null;
  onSelect: (id: string | null) => void;
  onOpenPositionClick?: () => void;
}

interface PnLData {
  pnlUsd?: string | number;
  pnlPctChange?: string | number;
  allTimeFees?: {
    total?: { usd?: string | number };
    tokenX?: { usd?: string | number; amount?: string | number };
    tokenY?: { usd?: string | number; amount?: string | number };
  };
  unrealizedPnl?: {
    balanceTokenX?: { usd?: string | number };
    balanceTokenY?: { usd?: string | number };
    unclaimedFeeTokenX?: { amount?: string | number; usd?: string | number };
    unclaimedFeeTokenY?: { amount?: string | number; usd?: string | number };
    unclaimedRewardTokenX?: { amount?: string | number; usd?: string | number };
    unclaimedRewardTokenY?: { amount?: string | number; usd?: string | number };
  };
  unclaimedFees?: string | number;
  unclaimedFeesSol?: string | number;
  feePerTvl24h?: string | number;
}

export const PositionTable = ({
  positions,
  positionOrchestration = {},
  cycles,
  selectedPosId,
  onSelect,
  onOpenPositionClick,
}: PositionTableProps) => {
  const openPositions = positions.filter((pos: Position) => pos.state !== 'CLOSED');
  const closedPositions = positions
    .filter((pos: Position) => pos.state === 'CLOSED')
    .sort((a, b) => (b.openedAt ?? 0) - (a.openedAt ?? 0));

  const timeAgo = (ts?: number): string => {
    if (!ts) return '';
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  };

  const getPnLData = (pos: Position): PnLData => (pos.pnlData || pos.raw || {}) as PnLData;

  const renderSectionHeader = (label: string, count: number) => (
    <tr className="bg-[#0D0D0D] text-[#F4F4F0]">
      <td colSpan={4} className="py-1.5 px-3 font-bold uppercase tracking-widest text-sm">
        {label} ({count})
      </td>
    </tr>
  );

  const renderRow = (pos: Position, dimmed = false) => {
    const isSelected = selectedPosId === pos.id;
    const pnl = getPnLData(pos);

    const pnlUsd = pnl.pnlUsd !== undefined ? Number(pnl.pnlUsd) : undefined;
    const pnlPctChange = pnl.pnlPctChange !== undefined ? Number(pnl.pnlPctChange) : undefined;
    const unclaimedFeeXUsd =
      pnl.unrealizedPnl?.unclaimedFeeTokenX?.usd !== undefined ? Number(pnl.unrealizedPnl.unclaimedFeeTokenX.usd) : 0;
    const unclaimedFeeYUsd =
      pnl.unrealizedPnl?.unclaimedFeeTokenY?.usd !== undefined ? Number(pnl.unrealizedPnl.unclaimedFeeTokenY.usd) : 0;
    const unclaimedRewardXUsd =
      pnl.unrealizedPnl?.unclaimedRewardTokenX?.usd !== undefined ? Number(pnl.unrealizedPnl.unclaimedRewardTokenX.usd) : 0;
    const unclaimedRewardYUsd =
      pnl.unrealizedPnl?.unclaimedRewardTokenY?.usd !== undefined ? Number(pnl.unrealizedPnl.unclaimedRewardTokenY.usd) : 0;
    const totalClaimableUsd = unclaimedFeeXUsd + unclaimedFeeYUsd + unclaimedRewardXUsd + unclaimedRewardYUsd;
    const hasClaimable = totalClaimableUsd > 0;
    const feePct = pnl.feePerTvl24h !== undefined ? Number(pnl.feePerTvl24h) : undefined;

    const tokenXSym = getTokenSymbol(pos.tokenX);
    const tokenYSym = getTokenSymbol(pos.tokenY);
    const tokenXAmt = pos.tokenX ? formatAmount(pos.tokenX.amount, pos.tokenX.decimals) : '0';
    const tokenYAmt = pos.tokenY ? formatAmount(pos.tokenY.amount, pos.tokenY.decimals) : '0';
    const tokenXUsd =
      pnl.unrealizedPnl?.balanceTokenX?.usd !== undefined ? Number(pnl.unrealizedPnl.balanceTokenX.usd) : undefined;
    const tokenYUsd =
      pnl.unrealizedPnl?.balanceTokenY?.usd !== undefined ? Number(pnl.unrealizedPnl.balanceTokenY.usd) : undefined;

    const inRange = pos.status === 'In Range';

    // Find cycle for this position
    let cycleForPos: CycleMetrics | undefined;
    if (cycles) {
      cycleForPos = Array.from(cycles.values()).find((c) => c.positionsInCycle.some((p) => p.id === pos.id));
    }
    const isPartOfCycle = cycleForPos && cycleForPos.positionsInCycle.length > 1;

    return (
      <tr
        key={pos.id}
        onClick={() => onSelect(pos.id)}
        className={`border-b border-gray-200 hover:bg-[#F4F4F0] transition-colors cursor-pointer flex flex-col md:table-row ${isSelected ? 'bg-[#E5E5DF]' : ''} ${dimmed ? 'opacity-60' : ''}`}
      >
        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 block md:table-cell">
          <div className="flex items-start gap-2">
            {isSelected && <ChevronRight size={12} className="text-[#FF4500] mt-0.5 shrink-0" />}
            <div className="flex items-start gap-1.5">
              <span className={`mt-1 block w-2 h-2 rounded-full shrink-0 ${inRange ? 'bg-green-500' : 'bg-[#FF4500]'}`} />
              <div>
                <div className={`font-mono text-sm ${inRange ? 'text-green-600' : 'text-[#FF4500]'}`}>
                  ${pos.lowerBoundPrice !== undefined ? Number(pos.lowerBoundPrice).toFixed(2) : '---'}–$
                  {pos.upperBoundPrice !== undefined ? Number(pos.upperBoundPrice).toFixed(2) : '---'}
                </div>
                <div className="text-[13px] text-gray-400 font-mono">
                  {tokenYSym} per {tokenXSym}
                </div>
                {pos.openedAt && <div className="text-[14px] text-gray-400 font-mono mt-0.5">{timeAgo(pos.openedAt)}</div>}
                {positionOrchestration[pos.id] && positionOrchestration[pos.id].strategyId !== 'NONE' && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-1.5 py-0.5 border border-green-200 rounded font-mono">
                      {positionOrchestration[pos.id].strategyId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 block md:table-cell">
          {(tokenXUsd !== undefined || tokenYUsd !== undefined) && (
            <div className="font-mono text-sm font-bold text-[#0D0D0D] mb-1">
              ${((tokenXUsd || 0) + (tokenYUsd || 0)).toFixed(2)}
            </div>
          )}
          <div className="font-mono text-sm leading-relaxed">
            <span className="font-bold">{tokenXAmt}</span>
            <span className="text-gray-500 ml-1">{tokenXSym}</span>
            {tokenXUsd !== undefined && <span className="text-gray-400 ml-1">(${tokenXUsd.toFixed(2)})</span>}
          </div>
          <div className="font-mono text-sm leading-relaxed">
            <span className="font-bold">{tokenYAmt}</span>
            <span className="text-gray-500 ml-1">{tokenYSym}</span>
            {tokenYUsd !== undefined && <span className="text-gray-400 ml-1">(${tokenYUsd.toFixed(2)})</span>}
          </div>
        </td>

        <td className="py-2 px-3 border-r-0 md:border-r border-gray-200 block md:table-cell">
          <div className="font-mono text-sm">
            {feePct !== undefined && <span className="font-bold mr-1">{feePct.toFixed(2)}%</span>}
            {hasClaimable && <span className="text-gray-700">${totalClaimableUsd.toFixed(4)}</span>}
            {!hasClaimable && <span className="text-gray-400">$0.00</span>}
          </div>
        </td>

        <td className="py-2 px-3 text-right block md:table-cell">
          <div
            className={`font-mono text-sm font-bold ${pnlUsd !== undefined ? (pnlUsd >= 0 ? 'text-green-600' : 'text-[#FF4500]') : 'text-[#0D0D0D]'}`}
          >
            {pnlUsd !== undefined ? `${pnlUsd >= 0 ? '+' : ''}$${pnlUsd.toFixed(4)}` : '$0.0000'}
          </div>
          {pnlPctChange !== undefined && (
            <div className={`font-mono text-[13px] ${pnlPctChange >= 0 ? 'text-green-600' : 'text-[#FF4500]'}`}>
              {pnlPctChange >= 0 ? '+' : ''}
              {pnlPctChange.toFixed(2)}%
            </div>
          )}
          {isPartOfCycle && cycleForPos && (
            <div
              className={`mt-1 font-mono text-[11px] ${cycleForPos.totalPnlUsd >= 0 ? 'text-green-700' : 'text-red-700'} opacity-80`}
              title="Full Cycle PnL"
            >
              ⟳ {cycleForPos.totalPnlUsd >= 0 ? '+' : ''}${Math.abs(cycleForPos.totalPnlUsd).toFixed(4)}
            </div>
          )}
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
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Price Range</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Your Liquidity</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D]">Claimable Fees</th>
                <th className="py-2 px-3 font-normal uppercase tracking-widest border-b border-[#0D0D0D] text-right">PnL</th>
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
