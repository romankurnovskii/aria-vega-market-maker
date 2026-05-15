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

import { formatAmount, getTokenSymbol } from '../containers/AriaVegaContainer';
import { PositionHeader } from './PositionHeader';
import { PositionBalances } from './PositionBalances';
import { PriceAnalytics } from './PriceAnalytics';
import { PnLAndFees } from './PnLAndFees';
import { OrchestrationControls } from './OrchestrationControls';
import { PositionActionButtons } from './PositionActionButtons';
import { EventLog } from './EventLog';

interface PositionDetailProps {
  position: any;
  orchestration: { strategyId: string; mode: string } | null;
  strategies: any[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
  onRemoveLiquidity: (positionId: string) => Promise<void>;
  evalLogs: any[];
  onClose: () => void;
}

export const PositionDetail = ({
  position,
  orchestration,
  strategies,
  onAssign,
  onEvaluate,
  onRemoveLiquidity,
  evalLogs,
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

  const handleAssign = () => {
    onAssign(position.id, selectedStrategyId, selectedMode);
  };

  const handleEvaluate = () => {
    console.log(`[PositionDetail] Evaluate button clicked for position: ${position.id}, strategy: ${selectedStrategyId}`);
    onEvaluate(position.id, selectedStrategyId);
  };

  return (
    <div className="flex flex-col gap-4 w-full lg:w-5/12 h-full min-h-0 animate-in slide-in-from-right-4 duration-300">
      {/* Actions Pane */}
      <div className="border border-[#0D0D0D] bg-white p-4 shrink-0 flex flex-col gap-4 overflow-y-auto">
        <PositionHeader positionId={position.id} pool={position.pool} state={position.state} onClose={onClose} />

        <PositionBalances
          tokenXSym={tokenXSym}
          tokenYSym={tokenYSym}
          tokenX={position.tokenX}
          tokenY={position.tokenY}
          unrealizedPnlTokenXUsd={pnl.unrealizedPnl?.balanceTokenX?.usd ? Number(pnl.unrealizedPnl.balanceTokenX.usd) : undefined}
          unrealizedPnlTokenYUsd={pnl.unrealizedPnl?.balanceTokenY?.usd ? Number(pnl.unrealizedPnl.balanceTokenY.usd) : undefined}
          formatAmount={formatAmount}
        />

        <PriceAnalytics
          minPrice={minPrice}
          maxPrice={maxPrice}
          poolActivePrice={poolActivePrice}
          feePerTvl24h={feePerTvl24h}
        />

        <PnLAndFees
          pnlUsd={pnlUsd}
          pnlPctChange={pnlPctChange}
          allTimeFeesTotalUsd={allTimeFeesTotalUsd}
          allTimeFeesXUsd={allTimeFeesXUsd}
          allTimeFeesXAmt={allTimeFeesXAmt}
          allTimeFeesYUsd={allTimeFeesYUsd}
          allTimeFeesYAmt={allTimeFeesYAmt}
          tokenXSym={tokenXSym}
          tokenYSym={tokenYSym}
        />

        <OrchestrationControls
          strategies={strategies}
          selectedStrategyId={selectedStrategyId}
          selectedMode={selectedMode}
          onStrategyChange={setSelectedStrategyId}
          onModeChange={setSelectedMode}
          onAssign={handleAssign}
          onEvaluate={handleEvaluate}
        />

        <PositionActionButtons
          positionId={position.id}
          state={position.state}
          onRemoveLiquidity={onRemoveLiquidity}
        />
      </div>

      <EventLog logs={evalLogs} />
    </div>
  );
};