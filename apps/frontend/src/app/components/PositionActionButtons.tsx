/**
 * @file PositionActionButtons.tsx
 * @description Presentational component for manual position management actions (e.g. Close Position / Remove Liquidity).
 */

'use client';

import React, { useState } from 'react';
import { LogOut, AlertTriangle, Loader2 } from 'lucide-react';

interface PositionActionButtonsProps {
  positionId: string;
  state: string;
  onRemoveLiquidity: (positionId: string) => Promise<void>;
}

export const PositionActionButtons = ({ positionId, state, onRemoveLiquidity }: PositionActionButtonsProps) => {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      await onRemoveLiquidity(positionId);
    } finally {
      setLoading(false);
    }
  };

  if (state === 'CLOSED') return null;

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-[#0D0D0D]/10">
      <div className="text-[11px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">
        <AlertTriangle size={10} /> Danger Zone
      </div>

      <button
        onClick={handleRemove}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 border border-red-600 p-2 text-xs font-bold uppercase text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
        Remove Liquidity
      </button>
    </div>
  );
};
