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
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Select Strategy</label>
        <div className="flex gap-2">
          <select
            value={selectedStrategyId}
            onChange={(e) => onStrategyChange(e.target.value)}
            className="flex-1 bg-[#F4F4F0] border border-[#0D0D0D] px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#FF4500] min-w-0"
          >
            <option value="NONE">-- NONE --</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={onEvaluate}
            className="bg-[#0D0D0D] text-[#F4F4F0] px-3 py-1 text-[10px] uppercase font-bold tracking-widest hover:bg-[#FF4500] transition-colors shrink-0"
          >
            Evaluate
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase font-bold tracking-widest opacity-50">Operation Mode</label>
        <div className="flex gap-2">
          <div className="flex-1 flex border border-[#0D0D0D] overflow-hidden">
            <button
              onClick={() => onModeChange('active')}
              className={`flex-1 py-1 text-[10px] uppercase font-bold transition-colors ${
                selectedMode === 'active' ? 'bg-[#0D0D0D] text-[#F4F4F0]' : 'bg-transparent text-[#0D0D0D] hover:bg-gray-100'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => onModeChange('monitor')}
              className={`flex-1 py-1 text-[10px] uppercase font-bold transition-colors ${
                selectedMode === 'monitor'
                  ? 'bg-[#0D0D0D] text-[#F4F4F0]'
                  : 'bg-transparent text-[#0D0D0D] hover:bg-gray-100'
              }`}
            >
              Monitor
            </button>
          </div>
          <button
            onClick={onAssign}
            className="bg-[#FF4500] text-[#F4F4F0] px-3 py-1 text-[10px] uppercase font-bold tracking-widest hover:bg-[#0D0D0D] transition-colors shadow-[2px_2px_0_#0D0D0D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};
