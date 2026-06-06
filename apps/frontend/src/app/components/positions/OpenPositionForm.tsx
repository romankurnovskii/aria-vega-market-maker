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

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { getTokenSymbol } from '../../utils/format';
import type { Wallet } from '../../types/api';

interface OpenPositionFormProps {
  wallets: Wallet[];
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

export const OpenPositionForm = ({ wallets, onOpen, onClose }: OpenPositionFormProps) => {
  const [formData, setFormData] = useState({
    pool_address: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6', // Default from example
    lower_price: '84',
    upper_price: '84.9',
    base_token_amount: '0',
    quote_token_amount: '1',
    slippage_pct: '0.1',
    wallet_address: wallets[0]?.address || 'Fdno6tMRL5tyvhX629T27zJjBAvQkBxWY2BdHnGbQEpL', // Default from example
  });

  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [binStep, setBinStep] = useState<number | null>(null);
  const [tokenXSym, setTokenXSym] = useState<string | null>(null);
  const [tokenYSym, setTokenYSym] = useState<string | null>(null);
  const [tokenXMint, setTokenXMint] = useState<string | null>(null);
  const [tokenYMint, setTokenYMint] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const binStepFactor = binStep ? 1 + binStep / 10000 : null;

  // Extract token balances from the selected wallet's portfolio
  const tokenXBalance = useMemo(() => {
    return findBalanceInPortfolio(wallets, formData.wallet_address, tokenXMint);
  }, [wallets, formData.wallet_address, tokenXMint]);

  const tokenYBalance = useMemo(() => {
    return findBalanceInPortfolio(wallets, formData.wallet_address, tokenYMint);
  }, [wallets, formData.wallet_address, tokenYMint]);

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
      [field]: (current * factor).toFixed(6),
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

        const xMint: string | undefined = data.poolInfo?.tokenXMint;
        const yMint: string | undefined = data.poolInfo?.tokenYMint;

        setMarketPrice(data.market.price);
        setBinStep(data.poolInfo?.binStep ?? null);
        setTokenXSym(getTokenSymbol({ mint: xMint }));
        setTokenYSym(getTokenSymbol({ mint: yMint }));
        setTokenXMint(xMint ?? null);
        setTokenYMint(yMint ?? null);

        if (isFirstLoadRef.current) {
          // Suggest default amounts from wallet balances if available
          const defaultBaseAmount = suggestDefaultAmount(wallets, formData.wallet_address, xMint);
          const defaultQuoteAmount = suggestDefaultAmount(wallets, formData.wallet_address, yMint);

          setFormData((prev) => ({
            ...prev,
            upper_price: data.market.price.toFixed(6),
            lower_price: (data.market.price * 0.99).toFixed(6),
            base_token_amount: defaultBaseAmount !== null ? String(defaultBaseAmount) : prev.base_token_amount,
            quote_token_amount: defaultQuoteAmount !== null ? String(defaultQuoteAmount) : prev.quote_token_amount,
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
                Market Price: <span className="font-bold text-[#FF4500]">{marketPrice.toFixed(6)}</span>
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
          <div className="flex flex-col gap-1 -mt-2">
            <div className="flex justify-between text-xs text-gray-500 px-1">
              <span>
                Range: <strong className="text-[#0D0D0D]">{rangePct.toFixed(2)}%</strong>
              </span>
              <span>
                Bins: <strong className={binCount > 69 ? 'text-[#FF3D00]' : 'text-[#0D0D0D]'}>{binCount}</strong>
              </span>
            </div>
            {binCount > 69 && (
              <div className="px-2 py-1.5 border border-[#FFEA00] bg-yellow-50 flex gap-2 items-start mt-1">
                <span className="text-[#FFEA00] mt-0.5">⚠️</span>
                <p className="text-[11px] leading-tight text-[#0D0D0D] font-mono">
                  <strong>Warning:</strong> Positions wider than 69 bins may fail to open in a single Solana transaction due
                  to execution limits.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">{tokenXSym || 'Base Token'} Amount</label>
            <input
              type="number"
              step="any"
              name="base_token_amount"
              value={formData.base_token_amount}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
            {tokenXBalance !== null && tokenXSym && (
              <div className="text-[11px] text-gray-500">
                Balance: <span className="font-medium text-[#0D0D0D]">{tokenXBalance.toLocaleString()}</span> {tokenXSym}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="uppercase font-bold text-gray-600">{tokenYSym || 'Quote Token'} Amount</label>
            <input
              type="number"
              step="any"
              name="quote_token_amount"
              value={formData.quote_token_amount}
              onChange={handleChange}
              className="border border-[#0D0D0D] p-1.5 focus:outline-none focus:bg-[#F4F4F0]"
              required
            />
            {tokenYBalance !== null && tokenYSym && (
              <div className="text-[11px] text-gray-500">
                Balance: <span className="font-medium text-[#0D0D0D]">{tokenYBalance.toLocaleString()}</span> {tokenYSym}
              </div>
            )}
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

/**
 * Looks up a token balance for a specific mint in the selected wallet's portfolio.
 * The portfolio data from the wallets endpoint may have varying structures — handles
 * common patterns (tokens array, flat balances, etc.).
 */
function findBalanceInPortfolio(wallets: Wallet[], walletAddress: string, mint: string | null): number | null {
  if (!mint || !walletAddress) return null;

  const wallet = wallets.find((w) => w.address === walletAddress);
  if (!wallet?.portfolio) return null;

  const portfolio = wallet.portfolio;

  // Pattern 1: tokens array with mint/amount fields (Meteora Datapi format)
  const tokens = (portfolio as Record<string, unknown>).tokens as
    | Array<{ mint?: string; amount?: string; decimals?: number; uiAmount?: number }>
    | undefined;
  if (Array.isArray(tokens)) {
    const token = tokens.find((t) => t.mint?.toLowerCase() === mint.toLowerCase());
    if (token) {
      const amount = token.uiAmount ?? (token.amount ? parseFloat(token.amount) : null);
      if (amount !== null && !isNaN(amount) && amount > 0) return amount;
    }
  }

  // Pattern 2: flat object with mint addresses as keys
  const flatBalance = (portfolio as Record<string, unknown>)[mint] as
    | string
    | number
    | { amount?: string; uiAmount?: number }
    | undefined;
  if (flatBalance !== undefined) {
    if (typeof flatBalance === 'number' && flatBalance > 0) return flatBalance;
    if (typeof flatBalance === 'string') {
      const parsed = parseFloat(flatBalance);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (typeof flatBalance === 'object' && flatBalance !== null) {
      const objFlat = flatBalance as { amount?: string; uiAmount?: number };
      const amt = objFlat.uiAmount ?? (objFlat.amount ? parseFloat(objFlat.amount) : null);
      if (amt !== null && !isNaN(amt) && amt > 0) return amt;
    }
  }

  return null;
}

/**
 * Suggests a small default amount (10% of wallet balance, minimum 1 unit)
 * for a given mint from wallet portfolio data.
 * Returns null if no balance data is available.
 */
function suggestDefaultAmount(wallets: Wallet[], walletAddress: string, mint: string | null | undefined): number | null {
  if (!mint) return null;

  const balance = findBalanceInPortfolio(wallets, walletAddress, mint);
  if (balance === null) return null;

  // Suggest 10% of balance, minimum 1 unit
  const suggested = Math.max(1, Math.floor(balance * 0.1));
  return suggested;
}
