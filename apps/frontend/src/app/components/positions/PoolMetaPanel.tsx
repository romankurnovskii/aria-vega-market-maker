/**
 * @file PoolMetaPanel.tsx
 * @description Presentational component that displays pool metadata: token pair, fee tier,
 *              bin step, and pool address with a copy-to-clipboard button.
 *
 * @features
 * - Shows token symbols (X / Y) and pool address (truncated plus copy)
 * - Displays bin step, base fee, and fee rate
 * - Handles missing/null pool meta gracefully with "—" fallback
 *
 * @dependencies app-store types (PoolMeta)
 */

'use client';

import React from 'react';
import type { PoolMeta } from '../../stores/app-store';

interface TokenFee {
  amount?: string | number;
  usd?: string | number;
}

interface PoolMetaPanelProps {
  poolMeta?: PoolMeta | null;
  status: string;
  state: string;
  activeBin?: number;
  pnlData?: Record<string, unknown>;
  unclaimedFeeX?: TokenFee;
  unclaimedFeeY?: TokenFee;
  unclaimedRewardX?: TokenFee;
  unclaimedRewardY?: TokenFee;
}

export const PoolMetaPanel = ({
  poolMeta,
  status,
  state,
  activeBin,
  pnlData,
  unclaimedFeeX,
  unclaimedFeeY,
  unclaimedRewardX,
  unclaimedRewardY,
}: PoolMetaPanelProps) => {
  const outOfRange = status === 'Out of Range';

  const pnlPctChange = pnlData?.pnlPctChange !== undefined ? Number(pnlData.pnlPctChange) : undefined;

  const unclaimedFeeXAmt = unclaimedFeeX?.amount !== undefined ? Number(unclaimedFeeX.amount) : undefined;
  const unclaimedFeeYAmt = unclaimedFeeY?.amount !== undefined ? Number(unclaimedFeeY.amount) : undefined;
  const unclaimedRewardXAmt = unclaimedRewardX?.amount !== undefined ? Number(unclaimedRewardX.amount) : undefined;
  const unclaimedRewardYAmt = unclaimedRewardY?.amount !== undefined ? Number(unclaimedRewardY.amount) : undefined;

  return (
    <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-sm flex flex-col gap-1.5">
      <div className="text-[14px] text-gray-500 uppercase tracking-widest font-bold">Pool Info</div>

      {poolMeta && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Pool:</span>
          <span className="font-bold text-[#0D0D0D]">{poolMeta.name}</span>
        </div>
      )}

      <div className="flex justify-between font-mono-jb items-center">
        <span className="text-gray-500">State:</span>
        <div className="flex items-center gap-2">
          {state !== 'OPEN' && (
            <span
              className={`text-[13px] px-1 py-0.5 border tracking-wide font-mono ${
                state === 'REBALANCING'
                  ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                  : state === 'CLOSING'
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : state === 'CREATING'
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-red-500 text-red-600 bg-red-50'
              }`}
            >
              {state}
            </span>
          )}
          {outOfRange && (
            <span className="text-[13px] px-1 py-0.5 border border-[#FF4500] text-[#FF4500] bg-red-50 tracking-wide font-mono">
              OUT OF RANGE
            </span>
          )}
          {!outOfRange && state === 'OPEN' && (
            <span className="text-[13px] px-1 py-0.5 border border-green-500 text-green-600 bg-green-50 tracking-wide font-mono">
              IN RANGE
            </span>
          )}
        </div>
      </div>

      {poolMeta && (
        <>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">Bin Step:</span>
            <span className="font-bold text-[#0D0D0D]">{poolMeta.binStep} bps</span>
          </div>
          <div className="flex justify-between font-mono-jb">
            <span className="text-gray-500">Base Fee:</span>
            <span className="font-bold text-[#0D0D0D]">
              {poolMeta.feeRate > 0 ? `${(poolMeta.feeRate * 100).toFixed(5)}%` : `${poolMeta.baseFee.toFixed(5)}%`}
            </span>
          </div>
        </>
      )}

      {activeBin !== undefined && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Active Bin:</span>
          <span className="font-bold text-[#0D0D0D]">{activeBin}</span>
        </div>
      )}

      {unclaimedFeeXAmt !== undefined && unclaimedFeeXAmt > 0 && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Unclaimed Fee (Token X):</span>
          <span className="font-bold text-[#0D0D0D]">{unclaimedFeeXAmt.toFixed(6)}</span>
        </div>
      )}

      {unclaimedFeeYAmt !== undefined && unclaimedFeeYAmt > 0 && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Unclaimed Fee (Token Y):</span>
          <span className="font-bold text-[#0D0D0D]">{unclaimedFeeYAmt.toFixed(6)}</span>
        </div>
      )}

      {unclaimedRewardXAmt !== undefined && unclaimedRewardXAmt > 0 && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Unclaimed Reward (Token X):</span>
          <span className="font-bold text-[#0D0D0D]">{unclaimedRewardXAmt.toFixed(6)}</span>
        </div>
      )}

      {unclaimedRewardYAmt !== undefined && unclaimedRewardYAmt > 0 && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">Unclaimed Reward (Token Y):</span>
          <span className="font-bold text-[#0D0D0D]">{unclaimedRewardYAmt.toFixed(6)}</span>
        </div>
      )}

      {pnlPctChange !== undefined && (
        <div className="flex justify-between font-mono-jb">
          <span className="text-gray-500">PnL Change:</span>
          <span className={`font-bold ${pnlPctChange >= 0 ? 'text-green-600' : 'text-[#FF4500]'}`}>
            {pnlPctChange >= 0 ? '+' : ''}
            {pnlPctChange.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};
