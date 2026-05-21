/**
 * @file PositionsView.tsx
 * @description Presentational component for the positions tab. Manages position selection state
 *              and orchestration mapping, then delegates to PositionTable and PositionDetail.
 *
 * @features
 * - Holds selectedPosId state for which position is currently selected
 * - Computes positionOrchestration map from assignments for highlighting
 * - Renders PositionTable alongside PositionDetail in a responsive grid
 *
 * @dependencies PositionTable, PositionDetail
 * @sideEffects None
 */

'use client';

import React, { useState, useMemo } from 'react';
import { PositionTable } from './PositionTable';
import { PositionDetail } from './PositionDetail';
import { OpenPositionForm } from './OpenPositionForm';
import { buildPositionCycles } from '../../utils/cycleCalculations';
import type { Assignment, Strategy, Position, EvalLogEntry, PositionLineageRecord } from '../../types/api';

interface Props {
  positions: Position[];
  lineage: PositionLineageRecord[];
  assignments: Assignment[];
  strategies: Strategy[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
  onApplyStrategy: (positionId: string, strategyId: string) => Promise<void>;
  onApplySuggestion: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => void;
  onOpenPosition: (params: {
    pool_address: string;
    lower_price: number;
    upper_price: number;
    base_token_amount: number;
    quote_token_amount: number;
    slippage_pct: number;
    wallet_address: string;
    extra_params?: Record<string, unknown>;
  }) => Promise<void>;
  evalLogs: EvalLogEntry[];
}

export const PositionsView = ({
  positions,
  lineage,
  assignments,
  strategies,
  onAssign,
  onEvaluate,
  onApplyStrategy,
  onApplySuggestion,
  onOpenPosition,
  evalLogs,
}: Props) => {
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const [isOpeningPosition, setIsOpeningPosition] = useState(false);

  const positionOrchestration = useMemo(() => {
    const map: Record<string, { strategyId: string; mode: string }> = {};
    assignments.forEach((a: Assignment) => {
      map[a.positionId] = { strategyId: a.strategyId, mode: a.mode };
    });
    return map;
  }, [assignments]);

  const cycles = useMemo(() => buildPositionCycles(positions, lineage), [positions, lineage]);

  const selectedPos = positions.find((p: Position) => p.id === selectedPosId);
  const selectedOrch = selectedPos ? positionOrchestration[selectedPos.id] : null;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-2 overflow-hidden">
      <div
        className={`flex flex-col transition-all duration-300 ${selectedPosId || isOpeningPosition ? 'lg:w-1/2 w-full' : 'w-full'} ${selectedPosId || isOpeningPosition ? 'hidden lg:flex' : 'flex'}`}
      >
        <PositionTable
          positions={positions}
          cycles={cycles}
          positionOrchestration={positionOrchestration}
          selectedPosId={selectedPosId}
          onSelect={(id) => {
            setSelectedPosId(id);
            if (id) setIsOpeningPosition(false);
          }}
          onOpenPositionClick={() => {
            setIsOpeningPosition(true);
            setSelectedPosId(null);
          }}
        />
      </div>

      {(selectedPos || isOpeningPosition) && (
        <div className="flex flex-1 gap-2 min-w-0 animate-in slide-in-from-bottom-4 lg:slide-in-from-right-4 duration-300">
          {isOpeningPosition ? (
            <OpenPositionForm onOpen={onOpenPosition} onClose={() => setIsOpeningPosition(false)} />
          ) : selectedPos ? (
            <PositionDetail
              key={selectedPos.id}
              position={selectedPos}
              cycle={Array.from(cycles.values()).find((c) => c.positionsInCycle.some((p) => p.id === selectedPos.id))}
              orchestration={selectedOrch}
              strategies={strategies}
              onAssign={onAssign}
              onEvaluate={onEvaluate}
              onApplyStrategy={onApplyStrategy}
              onApplySuggestion={onApplySuggestion}
              evalLogs={evalLogs}
              onClose={() => setSelectedPosId(null)}
              onSelectPosition={(id) => setSelectedPosId(id)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};
