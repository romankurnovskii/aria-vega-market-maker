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
import { Zap } from 'lucide-react';

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
    <div className="flex flex-col gap-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#FF4500]">Orchestration & Strategy</div>
      <div className="flex flex-col gap-2">
        <select
          value={selectedStrategyId}
          onChange={(e) => onStrategyChange(e.target.value)}
          className="w-full bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
        >
          <option value="NONE">-- No Strategy (Unassign) --</option>
          {strategies.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.id})
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={selectedMode}
            onChange={(e) => onModeChange(e.target.value)}
            className="flex-1 bg-[#F4F4F0] border border-[#0D0D0D] p-2 text-xs uppercase outline-none focus:border-[#FF4500]"
            disabled={selectedStrategyId === 'NONE'}
          >
            <option value="active">Active</option>
            <option value="monitor">Monitor</option>
          </select>

          <button
            onClick={onAssign}
            className="flex-1 bg-[#0D0D0D] text-[#F4F4F0] p-2 text-xs font-bold uppercase hover:bg-[#FF4500] transition-colors border border-[#0D0D0D]"
          >
            Set Assignment
          </button>
        </div>
      </div>

      <div className="pt-1">
        <button
          onClick={onEvaluate}
          disabled={selectedStrategyId === 'NONE'}
          className="w-full flex items-center justify-center gap-2 border border-[#0D0D0D] p-2 text-xs font-bold uppercase hover:bg-[#F4F4F0] hover:text-[#FF4500] hover:border-[#FF4500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={14} /> Evaluate Strategy
        </button>
      </div>
    </div>
  );
};
