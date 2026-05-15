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
  const [confirming, setConfirming] = useState(false);

  const handleRemove = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    try {
      await onRemoveLiquidity(positionId);
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (state === 'CLOSED') return null;

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-[#0D0D0D]/10">
      <div className="text-[10px] font-bold uppercase tracking-widest text-red-600 flex items-center gap-1">
        <AlertTriangle size={10} /> Danger Zone
      </div>
      
      <button
        onClick={handleRemove}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 border p-2 text-xs font-bold uppercase transition-all ${
          confirming 
            ? 'bg-red-600 border-red-600 text-white hover:bg-red-700 animate-pulse' 
            : 'border-red-600 text-red-600 hover:bg-red-50'
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <LogOut size={14} />
        )}
        {confirming ? 'Confirm Remove Liquidity?' : 'Remove Liquidity'}
      </button>

      {confirming && !loading && (
        <button 
          onClick={() => setConfirming(false)}
          className="text-[9px] uppercase underline text-center opacity-50 hover:opacity-100"
        >
          Cancel
        </button>
      )}
    </div>
  );
};
