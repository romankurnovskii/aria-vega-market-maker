'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'pool_address') {
      setIsFirstLoad(true);
      setMarketPrice(null);
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

        if (isFirstLoad) {
          setFormData((prev) => ({
            ...prev,
            upper_price: String(data.market.price),
            lower_price: String(data.market.price * 0.99),
          }));
          setIsFirstLoad(false);
        }
      } catch (err) {
        console.error('Error fetching pool info:', err);
      }
    };

    fetchPoolInfo();
    const interval = setInterval(fetchPoolInfo, 2000);

    return () => clearInterval(interval);
  }, [formData.pool_address, isFirstLoad]);

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

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 flex flex-col gap-4 text-xs font-mono">
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
            <div className="text-xs text-gray-500 mt-1">
              Market Price: <span className="font-bold text-[#FF4500]">{marketPrice.toFixed(6)}</span>
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
            <input
              type="number"
              step="any"
              name="lower_price"
              value={formData.lower_price}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">Upper Price</label>
            <input
              type="number"
              step="any"
              name="upper_price"
              value={formData.upper_price}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
          </div>
        </div>

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
