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
  events: string[];
  onAssign: (positionId: string, strategyId: string, mode: string) => Promise<void>;
  onEvaluate: (positionId: string, strategyId: string) => Promise<void>;
}

export const PositionsView = ({ positions, assignments, strategies, events, onAssign, onEvaluate }: Props) => {
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
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-0">
      <PositionTable
        positions={positions}
        positionOrchestration={positionOrchestration}
        selectedPosId={selectedPosId}
        onSelect={setSelectedPosId}
      />

      {selectedPos && (
        <PositionDetail
          position={selectedPos}
          orchestration={selectedOrch}
          strategies={strategies}
          events={events}
          onAssign={onAssign}
          onEvaluate={onEvaluate}
          onClose={() => setSelectedPosId(null)}
        />
      )}
    </div>
  );
};