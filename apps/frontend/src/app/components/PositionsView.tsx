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

interface Props {
  positions: any[];
  assignments: any[];
  strategies: any[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
  onRemoveLiquidity: (positionId: string) => Promise<void>;
  onApplySuggestion: (positionId: string, strategyId: string, suggestion: { action: string; openParams?: Record<string, unknown> }) => void;
  evalLogs: any[];
}

export const PositionsView = ({
  positions,
  assignments,
  strategies,
  onAssign,
  onEvaluate,
  onRemoveLiquidity,
  onApplySuggestion,
  evalLogs,
}: Props) => {
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);

  const positionOrchestration = useMemo(() => {
    const map: Record<string, { strategyId: string; mode: string }> = {};
    assignments.forEach((a: any) => {
      map[a.positionId] = { strategyId: a.strategyId, mode: a.mode };
    });
    return map;
  }, [assignments]);

  const selectedPos = positions.find((p: any) => p.id === selectedPosId);
  const selectedOrch = selectedPos ? positionOrchestration[selectedPos.id] : null;

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <div className={`flex flex-col transition-all duration-300 ${selectedPosId ? 'w-1/3' : 'w-full'}`}>
        <PositionTable
          positions={positions}
          positionOrchestration={positionOrchestration}
          selectedPosId={selectedPosId}
          onSelect={setSelectedPosId}
        />
      </div>

      {selectedPos && (
        <div className="flex flex-1 gap-4 min-w-0 animate-in slide-in-from-right-4 duration-300">
          <PositionDetail
            position={selectedPos}
            orchestration={selectedOrch}
            strategies={strategies}
            onAssign={onAssign}
            onEvaluate={onEvaluate}
            onRemoveLiquidity={onRemoveLiquidity}
            onApplySuggestion={onApplySuggestion}
            evalLogs={evalLogs}
            onClose={() => setSelectedPosId(null)}
          />
        </div>
      )}
    </div>
  );
};