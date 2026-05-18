import React from 'react';

interface OperationModeProps {
  selectedMode: string;
  onModeChange: (value: string) => void;
  onAssign: () => void;
}

export const OperationMode = ({ selectedMode, onModeChange, onAssign }: OperationModeProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-[12px] uppercase font-bold tracking-widest opacity-50">Operation Mode</label>
    <div className="flex gap-2">
      <div className="flex-1 flex border border-[#0D0D0D] overflow-hidden">
        <button
          onClick={() => onModeChange('active')}
          className={`flex-1 py-1 text-[12px] uppercase font-bold transition-colors ${
            selectedMode === 'active' ? 'bg-[#0D0D0D] text-[#F4F4F0]' : 'bg-transparent text-[#0D0D0D] hover:bg-gray-100'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => onModeChange('monitor')}
          className={`flex-1 py-1 text-[12px] uppercase font-bold transition-colors ${
            selectedMode === 'monitor' ? 'bg-[#0D0D0D] text-[#F4F4F0]' : 'bg-transparent text-[#0D0D0D] hover:bg-gray-100'
          }`}
        >
          Monitor
        </button>
      </div>
      <button
        onClick={onAssign}
        className="bg-[#FF4500] text-[#F4F4F0] px-3 py-1 text-[12px] uppercase font-bold tracking-widest hover:bg-[#0D0D0D] transition-colors shadow-[2px_2px_0_#0D0D0D] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none shrink-0"
      >
        Assign
      </button>
    </div>
  </div>
);
