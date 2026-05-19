/**
 * @file PositionBalances.tsx
 * @description Presentational component for displaying position token balances.
 * @features
 * - Shows Token X and Token Y balances
 * - Formats amounts using provided formatter
 * - Handles both USD value and raw token amounts
 */

'use client';

import React from 'react';

interface PositionBalancesProps {
  tokenXSym: string;
  tokenYSym: string;
  tokenX?: { amount: string; decimals: number } | null;
  tokenY?: { amount: string; decimals: number } | null;
  unrealizedPnlTokenXUsd?: number;
  unrealizedPnlTokenYUsd?: number;
  formatAmount: (amount: string, decimals: number) => string;
}

export const PositionBalances = ({
  tokenXSym,
  tokenYSym,
  tokenX,
  tokenY,
  unrealizedPnlTokenXUsd,
  unrealizedPnlTokenYUsd,
  formatAmount,
}: PositionBalancesProps) => {
  const renderBalance = (
    symbol: string,
    token: { amount: string; decimals: number } | null | undefined,
    usdValue: number | undefined
  ) => {
    return usdValue !== undefined && usdValue > 0
      ? `$${usdValue.toFixed(4)}`
      : token
        ? `${formatAmount(token.amount, token.decimals)}`
        : '0.00';
  };

  return (
    <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-sm">
      <div className="text-[13px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Position Balances</div>
      <div className="flex flex-col gap-1 font-mono-jb">
        <div className="flex justify-between">
          <span className="text-gray-500">{tokenXSym}:</span>
          <span className="font-bold text-[#0D0D0D]">{renderBalance(tokenXSym, tokenX, unrealizedPnlTokenXUsd)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{tokenYSym}:</span>
          <span className="font-bold text-[#0D0D0D]">{renderBalance(tokenYSym, tokenY, unrealizedPnlTokenYUsd)}</span>
        </div>
      </div>
    </div>
  );
};
