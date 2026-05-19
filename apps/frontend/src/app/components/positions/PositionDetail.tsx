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

import React, { useState } from 'react';

import { formatAmount, getTokenSymbol } from '../../utils/format';
import { useAppStore } from '../../stores/app-store';
import { PositionHeader } from './PositionHeader';
import { PoolMetaPanel } from './PoolMetaPanel';
import { PositionBalances } from './PositionBalances';
import { PriceAnalytics } from './PriceAnalytics';
import { PnLAndFees } from './PnLAndFees';
import { OrchestrationControls } from './OrchestrationControls';
import { EventLog } from '../ui/EventLog';
import type { Position, Strategy, EvalLogEntry } from '../../types/api';

interface PnLData {
  pnlUsd?: string | number;
  pnlPctChange?: string | number;
  minPrice?: string | number;
  maxPrice?: string | number;
  poolActivePrice?: string | number;
  feePerTvl24h?: string | number;
  unclaimedFees?: string | number;
  unclaimedFeesSol?: string | number;
  allTimeFees?: {
    total?: { usd?: string | number };
    tokenX?: { usd?: string | number; amount?: string | number };
    tokenY?: { usd?: string | number; amount?: string | number };
  };
  unrealizedPnl?: {
    balanceTokenX?: { usd?: string | number };
    balanceTokenY?: { usd?: string | number };
  };
}

interface PositionDetailProps {
  position: Position;
  orchestration: { strategyId: string; mode: string } | null;
  strategies: Strategy[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
  onApplyStrategy: (positionId: string, strategyId: string) => Promise<void>;
  onApplySuggestion: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => void;
  evalLogs: EvalLogEntry[];
  onClose: () => void;
}

export const PositionDetail = ({
  position,
  orchestration,
  strategies,
  onAssign,
  onEvaluate,
  onApplyStrategy,
  onApplySuggestion,
  evalLogs,
  onClose,
}: PositionDetailProps) => {
  const poolMeta = useAppStore((s) => s.poolMetaByAddress[position.pool]);

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    orchestration?.strategyId || strategies[0]?.id || 'NONE'
  );
  const [selectedMode, setSelectedMode] = useState<string>(orchestration?.mode || 'active');

  const pnl = (position.pnlData || position.raw || {}) as PnLData;

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

  const handleAssign = () => {
    onAssign(position.id, selectedStrategyId, selectedMode);
  };

  const handleEvaluate = () => {
    console.log(`[PositionDetail] Evaluate button clicked for position: ${position.id}, strategy: ${selectedStrategyId}`);
    onEvaluate(position.id, selectedStrategyId);
  };

  const handleApplyStrategy = () => {
    console.log(
      `[PositionDetail] Apply Strategy button clicked for position: ${position.id}, strategy: ${selectedStrategyId}`
    );
    onApplyStrategy(position.id, selectedStrategyId);
  };

  const isClosed = position.state === 'CLOSED';

  return (
    <div className="flex flex-1 flex-col gap-4 min-h-0">
      {/* Actions Pane */}
      <div className="flex-1 border border-[#0D0D0D] bg-white p-4 flex flex-col gap-4 overflow-y-auto min-h-[300px]">
        <PositionHeader
          positionId={position.id}
          pool={position.pool}
          state={position.state}
          openedAt={position.openedAt}
          onClose={onClose}
        />

        <div className="flex flex-wrap gap-4 w-full">
          <div className="flex-1 min-w-[280px] max-w-[400px]">
            <PoolMetaPanel
              poolMeta={poolMeta}
              status={position.status}
              state={position.state}
              activeBin={position.activeBin}
              pnlData={pnl as Record<string, unknown>}
            />
          </div>
          <div className="flex-1 min-w-[280px] max-w-[400px]">
            <PositionBalances
              tokenXSym={tokenXSym}
              tokenYSym={tokenYSym}
              tokenX={position.tokenX}
              tokenY={position.tokenY}
              unrealizedPnlTokenXUsd={
                pnl.unrealizedPnl?.balanceTokenX?.usd ? Number(pnl.unrealizedPnl.balanceTokenX.usd) : undefined
              }
              unrealizedPnlTokenYUsd={
                pnl.unrealizedPnl?.balanceTokenY?.usd ? Number(pnl.unrealizedPnl.balanceTokenY.usd) : undefined
              }
              formatAmount={formatAmount}
            />
          </div>
          <div className="flex-1 min-w-[280px] max-w-[400px]">
            <PriceAnalytics
              minPrice={minPrice}
              maxPrice={maxPrice}
              poolActivePrice={poolActivePrice}
              feePerTvl24h={feePerTvl24h}
            />
          </div>
          <div className="flex-1 min-w-[280px] max-w-[400px]">
            <PnLAndFees
              pnlUsd={pnlUsd}
              pnlPctChange={pnlPctChange}
              allTimeFeesTotalUsd={allTimeFeesTotalUsd}
              allTimeFeesXUsd={allTimeFeesXUsd}
              allTimeFeesXAmt={allTimeFeesXAmt as string | undefined}
              allTimeFeesYUsd={allTimeFeesYUsd}
              allTimeFeesYAmt={allTimeFeesYAmt as string | undefined}
              tokenXSym={tokenXSym}
              tokenYSym={tokenYSym}
            />
          </div>
        </div>

        {!isClosed && (
          <>
            <OrchestrationControls
              strategies={strategies}
              selectedStrategyId={selectedStrategyId}
              selectedMode={selectedMode}
              onStrategyChange={setSelectedStrategyId}
              onModeChange={setSelectedMode}
              onAssign={handleAssign}
              onEvaluate={handleEvaluate}
              onApplyStrategy={handleApplyStrategy}
            />
          </>
        )}
      </div>

      <EventLog logs={evalLogs} onApplySuggestion={onApplySuggestion} />
    </div>
  );
};
