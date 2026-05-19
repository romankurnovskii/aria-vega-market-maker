import React from 'react';

interface StrategySelectProps {
  strategies: Array<{ id: string; name: string }>;
  selectedStrategyId: string;
  onStrategyChange: (value: string) => void;
  onEvaluate: () => void;
  onApplyStrategy: () => void;
}

export const StrategySelect = ({
  strategies,
  selectedStrategyId,
  onStrategyChange,
  onEvaluate,
  onApplyStrategy,
}: StrategySelectProps) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[12px] uppercase font-bold tracking-widest opacity-50">Select Strategy</label>
    <div className="flex gap-2 w-full">
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
        className="bg-[#0D0D0D] text-[#F4F4F0] px-3 py-1 text-[12px] uppercase font-bold tracking-widest hover:bg-[#FF4500] transition-colors shrink-0"
      >
        Evaluate
      </button>
      <button
        onClick={onApplyStrategy}
        className="bg-[#FF4500] text-[#F4F4F0] px-3 py-1 text-[12px] uppercase font-bold tracking-widest hover:bg-[#0D0D0D] transition-colors shrink-0"
      >
        Apply
      </button>
    </div>
  </div>
);
