/**
 * @file OpenPositionForm.tsx
 * @description Modal form for opening a new liquidity position. Collects pool address,
 *              price range, deposit amounts, slippage, and wallet selection.
 *
 * @features
 * - Full modal overlay with backdrop close
 * - Price range inputs (lower / upper) with reverse detection
 * - Base and quote token amount fields
 * - Slippage percentage field
 * - Wallet selector dropdown populated from wallets prop
 * - Autofocus on first input when opened
 *
 * @dependencies lucide-react icons, format utils
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { getTokenSymbol } from '../../utils/format';

interface OpenPositionFormProps {
  onOpen: (params: {
    pool_address: string;
    lower_price: number;
    upper_price: number;
    base_token_amount: number;
    quote_token_amount: number;
    slippage_pct: number;
    wallet_address: string;
    extra_params?: Record<string, unknown>;
  }) => Promise<void>;
  onClose: () => void;
}

export const OpenPositionForm = ({ onOpen, onClose }: OpenPositionFormProps) => {
  const [formData, setFormData] = useState({
    pool_address: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6', // Default from example
    lower_price: '84',
    upper_price: '84.9',
    base_token_amount: '0',
    quote_token_amount: '1',
    slippage_pct: '0.1',
    wallet_address: 'Fdno6tMRL5tyvhX629T27zJjBAvQkBxWY2BdHnGbQEpL', // Default from example
  });

  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [binStep, setBinStep] = useState<number | null>(null);
  const [tokenXSym, setTokenXSym] = useState<string | null>(null);
  const [tokenYSym, setTokenYSym] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const binStepFactor = binStep ? 1 + binStep / 10000 : null;

  // Compute range info from current prices (re-renders on formData change)
  let rangePct: number | null = null;
  let binCount: number | null = null;
  if (binStepFactor) {
    const lower = parseFloat(formData.lower_price);
    const upper = parseFloat(formData.upper_price);
    if (!isNaN(lower) && !isNaN(upper) && lower > 0 && upper > 0) {
      const minP = Math.min(lower, upper);
      const maxP = Math.max(lower, upper);
      rangePct = ((maxP - minP) / minP) * 100;
      binCount = Math.abs(Math.round(Math.log(maxP / minP) / Math.log(binStepFactor)));
    }
  }

  const adjustPrice = (field: 'lower_price' | 'upper_price', direction: 'up' | 'down') => {
    if (!binStepFactor) return;
    const current = parseFloat(formData[field]);
    if (isNaN(current)) return;
    const factor = direction === 'up' ? binStepFactor : 1 / binStepFactor;
    setFormData((prev) => ({
      ...prev,
      [field]: (current * factor).toFixed(2),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'pool_address') {
      isFirstLoadRef.current = true;
      setMarketPrice(null);
      setBinStep(null);
      setTokenXSym(null);
      setTokenYSym(null);
    }
  };

  useEffect(() => {
    if (!formData.pool_address) return;

    const fetchPoolInfo = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';
        const res = await fetch(`${apiUrl}/gateway/pool/${formData.pool_address}`);
        if (!res.ok) throw new Error('Failed to fetch pool info');
        const data = await res.json();

        setMarketPrice(data.market.price);
        setBinStep(data.poolInfo?.binStep ?? null);
        setTokenXSym(getTokenSymbol({ mint: data.poolInfo?.tokenXMint }));
        setTokenYSym(getTokenSymbol({ mint: data.poolInfo?.tokenYMint }));

        if (isFirstLoadRef.current) {
          setFormData((prev) => ({
            ...prev,
            upper_price: data.market.price.toFixed(2),
            lower_price: (data.market.price * 0.99).toFixed(2),
          }));
          isFirstLoadRef.current = false;
        }
      } catch (err) {
        console.error('Error fetching pool info:', err);
      }
    };

    fetchPoolInfo();
    const interval = setInterval(fetchPoolInfo, 2000);

    return () => clearInterval(interval);
  }, [formData.pool_address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onOpen({
        pool_address: formData.pool_address,
        lower_price: parseFloat(formData.lower_price),
        upper_price: parseFloat(formData.upper_price),
        base_token_amount: parseFloat(formData.base_token_amount) || 0,
        quote_token_amount: parseFloat(formData.quote_token_amount) || 0,
        slippage_pct: parseFloat(formData.slippage_pct) || 0,
        wallet_address: formData.wallet_address,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to open position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-[#0D0D0D] bg-white overflow-hidden">
      <div className="p-2 border-b border-[#0D0D0D] flex justify-between items-center bg-[#0D0D0D] text-[#F4F4F0]">
        <h3 className="font-syne text-sm font-bold uppercase">Open New Position</h3>
        <button onClick={onClose} className="hover:text-[#FF4500] transition-colors">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 flex flex-col gap-4 text-sm font-mono">
        {error && <div className="p-2 border border-[#FF4500] text-[#FF4500] bg-red-50">Error: {error}</div>}

        <div className="flex flex-col gap-1">
          <label className="uppercase font-bold text-gray-600">Pool Address</label>
          <input
            type="text"
            name="pool_address"
            value={formData.pool_address}
            onChange={handleChange}
            className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
            required
          />
          {marketPrice !== null && (
            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-3">
              <span>
                Market Price: <span className="font-bold text-[#FF4500]">{marketPrice.toFixed(2)}</span>
              </span>
              {tokenXSym && tokenYSym && (
                <span>
                  Pool:{' '}
                  <span className="font-bold text-[#0D0D0D]">
                    {tokenXSym}-{tokenYSym}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="uppercase font-bold text-gray-600">Wallet Address</label>
          <input
            type="text"
            name="wallet_address"
            value={formData.wallet_address}
            onChange={handleChange}
            className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">Lower Price</label>
            <div className="flex">
              <input
                type="number"
                step="any"
                name="lower_price"
                value={formData.lower_price}
                onChange={handleChange}
                className="flex-1 border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
                required
              />
              {binStepFactor && (
                <>
                  <button
                    type="button"
                    onClick={() => adjustPrice('lower_price', 'down')}
                    className="border border-l-0 border-[#0D0D0D] px-2 hover:bg-[#F4F4F0] transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustPrice('lower_price', 'up')}
                    className="border border-l-0 border-[#0D0D0D] px-2 hover:bg-[#F4F4F0] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">Upper Price</label>
            <div className="flex">
              <input
                type="number"
                step="any"
                name="upper_price"
                value={formData.upper_price}
                onChange={handleChange}
                className="flex-1 border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
                required
              />
              {binStepFactor && (
                <>
                  <button
                    type="button"
                    onClick={() => adjustPrice('upper_price', 'down')}
                    className="border border-l-0 border-[#0D0D0D] px-2 hover:bg-[#F4F4F0] transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustPrice('upper_price', 'up')}
                    className="border border-l-0 border-[#0D0D0D] px-2 hover:bg-[#F4F4F0] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Range info: bin count and percentage */}
        {rangePct !== null && binCount !== null && (
          <div className="flex justify-between text-xs text-gray-500 px-1 -mt-2">
            <span>
              Range: <strong className="text-[#0D0D0D]">{rangePct.toFixed(2)}%</strong>
            </span>
            <span>
              Bins: <strong className="text-[#0D0D0D]">{binCount}</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">Base Token Amount</label>
            <input
              type="number"
              step="any"
              name="base_token_amount"
              value={formData.base_token_amount}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">Quote Token Amount</label>
            <input
              type="number"
              step="any"
              name="quote_token_amount"
              value={formData.quote_token_amount}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="uppercase font-bold text-gray-600">Slippage (%)</label>
          <input
            type="number"
            step="any"
            name="slippage_pct"
            value={formData.slippage_pct}
            onChange={handleChange}
            className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
            required
          />
        </div>

        <div className="mt-auto pt-4 border-t border-[#0D0D0D]">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 border border-[#0D0D0D] uppercase font-bold transition-colors ${
              loading ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#FF4500] text-[#F4F4F0] hover:bg-[#0D0D0D]'
            }`}
          >
            {loading ? 'Submitting...' : 'Open Position'}
          </button>
        </div>
      </form>
    </div>
  );
};
