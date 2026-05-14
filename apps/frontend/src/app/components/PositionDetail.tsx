/**
 * @file PositionDetail.tsx
 * @description Presentational component for the position detail pane — strategy assignment,
 *              orchestration mode selection, ad-hoc evaluation trigger, balances display, and event log.
 *
 * @features
 * - Displays balances for Token X and Token Y with formatted amounts
 * - Strategy dropdown and mode selector for assignment
 * - "Evaluate Ad-Hoc" button for manual trigger
 * - Embedded event log for the selected position
 *
 * @sideEffects None — all mutations flow through onAssign/onEvaluate callbacks
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Zap, X, TerminalSquare, ChevronRight } from 'lucide-react';

import { formatAmount, getTokenSymbol } from '../containers/AriaVegaContainer';
import { EventLog } from './EventLog';

interface PositionDetailProps {
  position: any;
  orchestration: { strategyId: string; mode: string } | null;
  strategies: any[];
  events: string[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
  onClose: () => void;
}

export const PositionDetail = ({
  position,
  orchestration,
  strategies,
  events,
  onAssign,
  onEvaluate,
  onClose,
}: PositionDetailProps) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('active');

  // Update local forms when selection changes
  useEffect(() => {
    if (orchestration) {
      setSelectedStrategyId(orchestration.strategyId);
      setSelectedMode(orchestration.mode);
    } else {
      setSelectedStrategyId(strategies[0]?.id || 'NONE');
      setSelectedMode('active');
    }
  }, [position.id, orchestration, strategies]);

  const pnl = position.pnlData || position.metadata?.pnl || position.raw || {};

  const pnlUsd = pnl.pnlUsd !== undefined ? Number(pnl.pnlUsd) : undefined;
  const pnlPctChange = pnl.pnlPctChange !== undefined ? Number(pnl.pnlPctChange) : undefined;
  const minPrice = pnl.minPrice !== undefined ? Number(pnl.minPrice) : position.lowerBoundPrice;
  const maxPrice = pnl.maxPrice !== undefined ? Number(pnl.maxPrice) : position.upperBoundPrice;
  const poolActivePrice = pnl.poolActivePrice !== undefined ? Number(pnl.poolActivePrice) : undefined;
  const feePerTvl24h = pnl.feePerTvl24h !== undefined ? Number(pnl.feePerTvl24h) : undefined;

  const allTimeFeesTotalUsd = pnl.allTimeFees?.total?.usd !== undefined ? Number(pnl.allTimeFees.total.usd) : undefined;
  const allTimeFeesXUsd = pnl.allTimeFees?.tokenX?.usd !== undefined ? Number(pnl.allTimeFees.tokenX.usd) : undefined;
  const allTimeFeesXAmt = pnl.allTimeFees?.tokenX?.amount !== undefined ? pnl.allTimeFees.tokenX.amount : undefined;
  const allTimeFeesYUsd = pnl.allTimeFees?.tokenY?.usd !== undefined ? Number(pnl.allTimeFees.tokenY.usd) : undefined;
  const allTimeFeesYAmt = pnl.allTimeFees?.tokenY?.amount !== undefined ? pnl.allTimeFees.tokenY.amount : undefined;

  const tokenXSym = getTokenSymbol(position.tokenX);
  const tokenYSym = getTokenSymbol(position.tokenY);

  return (
    <div className="flex flex-col gap-4 w-full lg:w-5/12 h-full min-h-0 animate-in slide-in-from-right-4 duration-300">
      {/* Actions Pane */}
      <div className="border border-[#0D0D0D] bg-white p-4 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="flex justify-between items-start border-b border-[#0D0D0D] pb-3">
          <div className="min-w-0">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target Position</div>
            <div className="font-syne font-bold text-lg truncate" title={position.id}>
              {position.id}
            </div>
            <div className="text-xs text-gray-600 truncate mt-1">
              Pool:{' '}
              <span className="font-mono text-[10px]" title={position.pool}>
                {position.pool}
              </span>
            </div>
            {/* State machine premium badge */}
            <div className="mt-2 flex items-center">
              <span
                className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-widest font-mono-jb ${
                  position.state === 'OPEN'
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : position.state === 'CREATING'
                      ? 'border-blue-500 text-blue-600 bg-blue-50 animate-pulse'
                      : position.state === 'REBALANCING'
                        ? 'border-yellow-500 text-yellow-600 bg-yellow-50 animate-pulse'
                        : position.state === 'CLOSING'
                          ? 'border-orange-500 text-orange-600 bg-orange-50 animate-pulse'
                          : position.state === 'CLOSED'
                            ? 'border-gray-500 text-gray-600 bg-gray-50'
                            : 'border-[#FF4500] text-[#FF4500] bg-red-50'
                }`}
              >
                {position.state}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-transparent hover:border-[#FF4500] hover:text-[#FF4500] transition-colors bg-[#F4F4F0]"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Balances Display */}
        <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-xs">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Position Balances</div>
          <div className="flex flex-col gap-1 font-mono-jb">
            <div className="flex justify-between">
              <span className="text-gray-500">{tokenXSym}:</span>
              <span className="font-bold text-[#0D0D0D]">
                {pnl.unrealizedPnl?.balanceTokenX?.usd !== undefined && Number(pnl.unrealizedPnl.balanceTokenX.usd) > 0
                  ? `$${Number(pnl.unrealizedPnl.balanceTokenX.usd).toFixed(4)}`
                  : position.tokenX
                  ? `${formatAmount(position.tokenX.amount, position.tokenX.decimals)}`
                  : '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{tokenYSym}:</span>
              <span className="font-bold text-[#0D0D0D]">
                {pnl.unrealizedPnl?.balanceTokenY?.usd !== undefined && Number(pnl.unrealizedPnl.balanceTokenY.usd) > 0
                  ? `$${Number(pnl.unrealizedPnl.balanceTokenY.usd).toFixed(4)}`
                  : position.tokenY
                  ? `${formatAmount(position.tokenY.amount, position.tokenY.decimals)}`
                  : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Market & Price Analytics */}
        <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-xs flex flex-col gap-1.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Price Analytics</div>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">Min / Max Price:</span>
            <span className="font-bold text-[#0D0D0D]">
              {minPrice !== undefined ? minPrice.toFixed(4) : '0.0000'} / {maxPrice !== undefined ? maxPrice.toFixed(4) : '0.0000'}
            </span>
          </div>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">Pool Active Price:</span>
            <span className="font-bold text-[#0D0D0D]">
              {poolActivePrice !== undefined ? poolActivePrice.toFixed(4) : '0.0000'}
            </span>
          </div>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">24h Fee / TVL:</span>
            <span className="font-bold text-[#0D0D0D]">
              {feePerTvl24h !== undefined ? `${feePerTvl24h.toFixed(2)}%` : '0.00%'}
            </span>
          </div>
        </div>

        {/* Realized PnL & All-Time Fees */}
        <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-xs flex flex-col gap-1.5">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">PnL & All-Time Fees</div>
          <div className="flex justify-between font-mono-jb items-center">
            <span className="text-gray-500">Realized PnL:</span>
            <span className={`font-bold ${pnlUsd && pnlUsd >= 0 ? 'text-green-600' : pnlUsd && pnlUsd < 0 ? 'text-[#FF4500]' : 'text-[#0D0D0D]'}`}>
              {pnlUsd !== undefined ? `$${pnlUsd.toFixed(4)}` : '$0.0000'}
              {pnlPctChange !== undefined && ` (${pnlPctChange >= 0 ? '+' : ''}${(pnlPctChange * 100).toFixed(2)}%)`}
            </span>
          </div>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">All-Time Fees (USD):</span>
            <span className="font-bold text-[#0D0D0D]">
              {allTimeFeesTotalUsd !== undefined ? `$${allTimeFeesTotalUsd.toFixed(4)}` : '$0.0000'}
            </span>
          </div>
          <div className="flex justify-between font-mono-jb text-[11px] pl-2 border-l border-gray-300">
            <span className="text-gray-500">{tokenXSym} Fees:</span>
            <span className="font-bold text-[#0D0D0D]">
              {allTimeFeesXUsd !== undefined && allTimeFeesXUsd > 0
                ? `$${allTimeFeesXUsd.toFixed(4)}`
                : allTimeFeesXAmt !== undefined
                ? `${allTimeFeesXAmt} ${tokenXSym}`
                : `$0.0000`}
            </span>
          </div>
          <div className="flex justify-between font-mono-jb text-[11px] pl-2 border-l border-gray-300">
            <span className="text-gray-500">{tokenYSym} Fees:</span>
            <span className="font-bold text-[#0D0D0D]">
              {allTimeFeesYUsd !== undefined && allTimeFeesYUsd > 0
                ? `$${allTimeFeesYUsd.toFixed(4)}`
                : allTimeFeesYAmt !== undefined
                ? `${allTimeFeesYAmt} ${tokenYSym}`
                : `$0.0000`}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4500]">Orchestration & Strategy</div>
          <div className="flex flex-col gap-2">
            <select
              value={selectedStrategyId}
              onChange={(e) => setSelectedStrategyId(e.target.value)}
              className="w-full bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
            >
              <option value="NONE">-- No Strategy (Unassign) --</option>
              {strategies.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="flex-1 bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
                disabled={selectedStrategyId === 'NONE'}
              >
                <option value="active">Active</option>
                <option value="monitor">Monitor</option>
              </select>

              <button
                onClick={() => onAssign(position.id, selectedStrategyId, selectedMode)}
                className="flex-1 bg-[#0D0D0D] text-[#F4F4F0] p-2 text-xs font-bold uppercase hover:bg-[#FF4500] transition-colors border border-[#0D0D0D]"
              >
                Set Assignment
              </button>
            </div>
          </div>

          <div className="pt-1">
            <button
              onClick={() => onEvaluate(position.id, selectedStrategyId)}
              disabled={selectedStrategyId === 'NONE' || !orchestration}
              className="w-full flex items-center justify-center gap-2 border border-[#0D0D0D] p-2 text-xs font-bold uppercase hover:bg-[#F4F4F0] hover:text-[#FF4500] hover:border-[#FF4500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={14} /> Evaluate Ad-Hoc
            </button>
          </div>
        </div>
      </div>

      {/* Events Log Pane */}
      <EventLog events={events} />
    </div>
  );
};