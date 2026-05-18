'use client';

import React, { useState } from 'react';

interface AddLiquidityFormProps {
  positionId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddLiquidityForm = ({ positionId, onSuccess, onCancel }: AddLiquidityFormProps) => {
  const [tokenXAmount, setTokenXAmount] = useState('');
  const [tokenYAmount, setTokenYAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/liquidity/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          positionId,
          tokenXAmount,
          tokenYAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add liquidity');
      }

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[#0D0D0D] bg-white p-4 shadow-[4px_4px_0_#0D0D0D]">
      <h2 className="font-syne text-lg font-bold uppercase mb-4">Add Liquidity</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-xs">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-[12px] uppercase tracking-widest font-bold mb-1">Token X Amount</label>
          <input
            type="text"
            value={tokenXAmount}
            onChange={(e) => setTokenXAmount(e.target.value)}
            className="w-full border border-[#0D0D0D] p-2 text-xs outline-none focus:border-[#FF4500] transition-colors"
            placeholder="e.g. 1000000"
            required
          />
        </div>
        <div>
          <label className="block text-[12px] uppercase tracking-widest font-bold mb-1">Token Y Amount</label>
          <input
            type="text"
            value={tokenYAmount}
            onChange={(e) => setTokenYAmount(e.target.value)}
            className="w-full border border-[#0D0D0D] p-2 text-xs outline-none focus:border-[#FF4500] transition-colors"
            placeholder="e.g. 1000000"
            required
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#0D0D0D] text-[#F4F4F0] py-2 px-4 text-xs font-bold uppercase hover:bg-[#FF4500] hover:text-[#0D0D0D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Add Liquidity'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-[#0D0D0D] py-2 px-4 text-xs font-bold uppercase hover:bg-[#F4F4F0] transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
