/**
 * @file PositionHeader.tsx
 * @description Presentational component for the position header section.
 * @features
 * - Displays position ID and pool address
 * - Shows state badge with color coding
 * - Close button for dismissing the detail view
 */

'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PositionHeaderProps {
  positionId: string;
  pool: string;
  state: string;
  onClose: () => void;
}

export const PositionHeader = ({ positionId, pool, state, onClose }: PositionHeaderProps) => {
  const getStateClasses = (state: string): string => {
    if (state === 'OPEN') return 'border-green-500 text-green-600 bg-green-50';
    if (state === 'CREATING') return 'border-blue-500 text-blue-600 bg-blue-50 animate-pulse';
    if (state === 'REBALANCING') return 'border-yellow-500 text-yellow-600 bg-yellow-50 animate-pulse';
    if (state === 'CLOSING') return 'border-orange-500 text-orange-600 bg-orange-50 animate-pulse';
    if (state === 'CLOSED') return 'border-gray-500 text-gray-600 bg-gray-50';
    return 'border-[#FF4500] text-[#FF4500] bg-red-50';
  };

  return (
    <div className="flex justify-between items-start border-b border-[#0D0D0D] pb-3">
      <div className="min-w-0">
        <div className="text-[12px] text-gray-500 uppercase tracking-widest mb-1">Target Position</div>
        <div className="font-syne font-bold text-sm truncate" title={positionId}>
          {positionId}
        </div>
        <div className="text-xs text-gray-600 truncate mt-1">
          Pool:{' '}
          <span className="font-mono text-[11px]" title={pool}>
            {pool}
          </span>
        </div>
        <div className="mt-2 flex items-center">
          <span
            className={`px-2 py-0.5 text-[11px] font-bold border uppercase tracking-widest font-mono-jb ${getStateClasses(state)}`}
          >
            {state}
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1 border border-transparent hover:border-[#FF4500] hover:text-[#FF4500] transition-colors bg-[#F4F4F0]"
        title="Close"
      >
        <X size={16} />
      </button>
    </div>
  );
};
