/**
 * @file PriceAnalytics.tsx
 * @description Presentational component for displaying price analytics.
 * @features
 * - Min/Max price range
 * - Pool active price
 * - 24h fee per TVL percentage
 */

'use client';

import React from 'react';

interface PriceAnalyticsProps {
  minPrice?: number;
  maxPrice?: number;
  poolActivePrice?: number;
  feePerTvl24h?: number;
}

export const PriceAnalytics = ({ minPrice, maxPrice, poolActivePrice, feePerTvl24h }: PriceAnalyticsProps) => {
  return (
    <div className="bg-[#F4F4F0] p-2.5 border border-[#0D0D0D] text-xs flex flex-col gap-1.5">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Price Analytics</div>
      <div className="flex justify-between font-mono-jb">
        <span className="text-gray-500">Min / Max Price:</span>
        <span className="font-bold text-[#0D0D0D]">
          {minPrice !== undefined ? minPrice.toFixed(4) : '0.0000'} /{' '}
          {maxPrice !== undefined ? maxPrice.toFixed(4) : '0.0000'}
        </span>
      </div>
      <div className="flex justify-between font-mono-jb">
        <span className="text-gray-500">Pool Active Price:</span>
        <span className="font-bold text-[#0D0D0D]">
          {poolActivePrice !== undefined ? poolActivePrice.toFixed(4) : '0.0000'}
        </span>
      </div>
      <div className="flex justify-between font-mono-jb">
        <span className="text-gray-500">24h Fee / TVL:</span>
        <span className="font-bold text-[#0D0D0D]">
          {feePerTvl24h !== undefined ? `${feePerTvl24h.toFixed(2)}%` : '0.00%'}
        </span>
      </div>
    </div>
  );
};