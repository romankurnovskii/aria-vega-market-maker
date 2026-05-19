/**
 * @file PnLAndFees.tsx
 * @description Presentational component for displaying PnL and all-time fees.
 * @features
 * - Realized PnL with percentage change
 * - Total all-time fees in USD
 * - Token-specific fees breakdown
 */

'use client';

import React from 'react';

interface TokenFee {
  amount?: string | number;
  usd?: string | number;
}

interface PnLAndFeesProps {
  pnlUsd?: number;
  pnlPctChange?: number;
  allTimeFeesTotalUsd?: number;
  allTimeFeesXUsd?: number;
  allTimeFeesXAmt?: string;
  allTimeFeesYUsd?: number;
  allTimeFeesYAmt?: string;
  tokenXSym: string;
  tokenYSym: string;
  unclaimedFeeX?: TokenFee;
  unclaimedFeeY?: TokenFee;
  unclaimedRewardX?: TokenFee;
  unclaimedRewardY?: TokenFee;
}

export const PnLAndFees = ({
  pnlUsd,
  pnlPctChange,
  allTimeFeesTotalUsd,
  allTimeFeesXUsd,
  allTimeFeesXAmt,
  allTimeFeesYUsd,
  allTimeFeesYAmt,
  tokenXSym,
  tokenYSym,
  unclaimedFeeX,
  unclaimedFeeY,
  unclaimedRewardX,
  unclaimedRewardY,
}: PnLAndFeesProps) => {
  const getPnLClasses = (value?: number): string => {
    if (value === undefined || value === null) return 'text-[#0D0D0D]';
    return value >= 0 ? 'text-green-600' : 'text-[#FF4500]';
  };

  const hasUnclaimed = unclaimedFeeX || unclaimedFeeY || unclaimedRewardX || unclaimedRewardY;

  const renderTokenFees = (usd?: number, amt?: string, symbol?: string) => {
    if (usd !== undefined && usd > 0) {
      return `$${usd.toFixed(4)}`;
    }
    if (amt !== undefined) {
      return `${amt} ${symbol}`;
    }
    return '$0.0000';
  };

  return (
    <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-sm flex flex-col gap-1.5">
      <div className="text-[13px] text-gray-500 uppercase tracking-widest font-bold">PnL & All-Time Fees</div>
      <div className="flex justify-between font-mono-jb items-center">
        <span className="text-gray-500">Realized PnL:</span>
        <span className={`font-bold ${getPnLClasses(pnlUsd)}`}>
          {pnlUsd !== undefined ? `$${pnlUsd.toFixed(4)}` : '$0.0000'}
          {pnlPctChange !== undefined && ` (${pnlPctChange >= 0 ? '+' : ''}${pnlPctChange.toFixed(2)}%)`}
        </span>
      </div>
      <div className="flex justify-between font-mono-jb">
        <span className="text-gray-500">All-Time Fees (USD):</span>
        <span className="font-bold text-[#0D0D0D]">
          {allTimeFeesTotalUsd !== undefined ? `$${allTimeFeesTotalUsd.toFixed(4)}` : '$0.0000'}
        </span>
      </div>
      <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
        <span className="text-gray-500">{tokenXSym} Fees:</span>
        <span className="font-bold text-[#0D0D0D]">{renderTokenFees(allTimeFeesXUsd, allTimeFeesXAmt, tokenXSym)}</span>
      </div>
      <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
        <span className="text-gray-500">{tokenYSym} Fees:</span>
        <span className="font-bold text-[#0D0D0D]">{renderTokenFees(allTimeFeesYUsd, allTimeFeesYAmt, tokenYSym)}</span>
      </div>

      {hasUnclaimed && (
        <>
          <div className="text-[13px] text-gray-500 uppercase tracking-widest font-bold mt-1">Unclaimed Fees</div>
          {unclaimedFeeX?.usd && Number(unclaimedFeeX.usd) > 0 && (
            <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
              <span className="text-gray-500">Unclaimed {tokenXSym} Fee:</span>
              <span className="font-bold text-[#0D0D0D]">
                ${Number(unclaimedFeeX.usd).toFixed(4)} ({unclaimedFeeX.amount} {tokenXSym})
              </span>
            </div>
          )}
          {unclaimedFeeY?.usd && Number(unclaimedFeeY.usd) > 0 && (
            <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
              <span className="text-gray-500">Unclaimed {tokenYSym} Fee:</span>
              <span className="font-bold text-[#0D0D0D]">
                ${Number(unclaimedFeeY.usd).toFixed(4)} ({unclaimedFeeY.amount} {tokenYSym})
              </span>
            </div>
          )}
          {unclaimedRewardX?.usd && Number(unclaimedRewardX.usd) > 0 && (
            <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
              <span className="text-gray-500">Unclaimed {tokenXSym} Reward:</span>
              <span className="font-bold text-[#0D0D0D]">
                ${Number(unclaimedRewardX.usd).toFixed(4)} ({unclaimedRewardX.amount} {tokenXSym})
              </span>
            </div>
          )}
          {unclaimedRewardY?.usd && Number(unclaimedRewardY.usd) > 0 && (
            <div className="flex justify-between font-mono-jb text-[13px] pl-2 border-l border-gray-300">
              <span className="text-gray-500">Unclaimed {tokenYSym} Reward:</span>
              <span className="font-bold text-[#0D0D0D]">
                ${Number(unclaimedRewardY.usd).toFixed(4)} ({unclaimedRewardY.amount} {tokenYSym})
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
