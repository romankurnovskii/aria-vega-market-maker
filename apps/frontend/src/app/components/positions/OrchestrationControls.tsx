/**
 * @file OrchestrationControls.tsx
 * @description Presentational component for strategy assignment and evaluation controls.
 * @features
 * - Strategy dropdown selector
 * - Mode selector (active/monitor)
 * - Assign button
 * - Evaluate ad-hoc button with zap icon
 */

'use client';

import React from 'react';
import { StrategySelect } from './StrategySelect';
import { OperationMode } from './OperationMode';

interface OrchestrationControlsProps {
  strategies: Array<{ id: string; name: string }>;
  selectedStrategyId: string;
  selectedMode: string;
  onStrategyChange: (value: string) => void;
  onModeChange: (value: string) => void;
  onAssign: () => void;
  onEvaluate: () => void;
}

export const OrchestrationControls = ({
  strategies,
  selectedStrategyId,
  selectedMode,
  onStrategyChange,
  onModeChange,
  onAssign,
  onEvaluate,
}: OrchestrationControlsProps) => {
  return (
    <div className="flex flex-col gap-3 border-t border-[#0D0D0D] pt-4 min-w-0">
      <div className="flex flex-row gap-4 w-full">
        <div className="flex-1 min-w-0">
          <StrategySelect
            strategies={strategies}
            selectedStrategyId={selectedStrategyId}
            onStrategyChange={onStrategyChange}
            onEvaluate={onEvaluate}
          />
        </div>
        <div className="flex-1 min-w-0">
          <OperationMode selectedMode={selectedMode} onModeChange={onModeChange} onAssign={onAssign} />
        </div>
      </div>
    </div>
  );
};
