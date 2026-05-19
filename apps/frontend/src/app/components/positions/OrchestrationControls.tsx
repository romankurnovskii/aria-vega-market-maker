/**
 * @file OrchestrationControls.tsx
 * @description Presentational component for strategy assignment and evaluation controls.
 * @features
 * - Strategy dropdown selector
 * - Single Assign button for Active Strategy
 * - Evaluate and Apply action controls
 */

'use client';

import React from 'react';
import { StrategySelect } from './StrategySelect';

interface OrchestrationControlsProps {
  strategies: Array<{ id: string; name: string }>;
  selectedStrategyId: string;
  onStrategyChange: (value: string) => void;
  onAssign: () => void;
  onEvaluate: () => void;
  onApplyStrategy: () => void;
}

export const OrchestrationControls = ({
  strategies,
  selectedStrategyId,
  onStrategyChange,
  onAssign,
  onEvaluate,
  onApplyStrategy,
}: OrchestrationControlsProps) => {
  return (
    <div className="flex flex-col gap-4 border-t border-[#0D0D0D] pt-4 min-w-0">
      <div className="flex flex-col md:flex-row gap-4 w-full items-end">
        <div className="flex-[2] min-w-0 w-full">
          <StrategySelect
            strategies={strategies}
            selectedStrategyId={selectedStrategyId}
            onStrategyChange={onStrategyChange}
            onEvaluate={onEvaluate}
            onApplyStrategy={onApplyStrategy}
          />
        </div>
        <div className="flex-1 min-w-0 w-full flex flex-col gap-2">
          <label className="text-[12px] uppercase font-bold tracking-widest opacity-50 block">Automation Registry</label>
          <button
            onClick={onAssign}
            className="w-full bg-[#FF4500] text-[#F4F4F0] py-1.5 px-3 text-[12px] uppercase font-bold tracking-widest hover:bg-[#0D0D0D] transition-colors border border-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none font-mono shrink-0"
          >
            Assign Active Strategy
          </button>
        </div>
      </div>
    </div>
  );
};
