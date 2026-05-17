/**
 * @file WalletsView.tsx
 * @description Displays wallet list with portfolio data including balances, PnL, and position counts.
 */

import React from 'react';
import { Star, TrendingUp, TrendingDown, Wallet as WalletIcon } from 'lucide-react';

interface Wallet {
  chain: string;
  address: string;
  is_default: boolean;
  portfolio?: {
    totalPositions?: number;
    total?: {
      totalPositions?: number;
      balances?: string;
      balancesSol?: string;
      unclaimedFees?: string;
      unclaimedFeesSol?: string;
      pnl?: string;
      pnlSol?: string;
      pnlPctChange?: string;
      pnlSolPctChange?: string;
    };
    pools?: Array<{
      poolAddress: string;
      tokenX: string;
      tokenY: string;
      binStep: number;
      balances: string;
      balancesSol: string;
      unclaimedFees: string;
      unclaimedFeesSol: string;
      pnl: string;
      pnlSol: string;
      pnlPctChange: string;
      pnlSolPctChange: string;
      openPositionCount: number;
      outOfRange: boolean;
      poolPrice: number;
    }>;
  } | null;
}

interface WalletsViewProps {
  wallets: Wallet[];
}

export const WalletsView = ({ wallets }: WalletsViewProps) => {
  const formatNumber = (val: string | undefined, decimals: number = 4): string => {
    if (!val) return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return '—';
    return num.toFixed(decimals);
  };

  const formatPrice = (val: string | undefined): string => {
    if (!val) return '—';
    const num = parseFloat(val);
    if (isNaN(num)) return '—';
    return num.toFixed(2);
  };

  const getPnlColor = (val: string | undefined): string => {
    if (!val) return 'text-[#0D0D0D]';
    const num = parseFloat(val);
    if (num > 0) return 'text-green-600';
    if (num < 0) return 'text-red-600';
    return 'text-[#0D0D0D]';
  };

  const totalPnL = wallets.reduce((acc, w) => {
    if (w.portfolio?.total?.pnl) {
      return acc + parseFloat(w.portfolio.total.pnl);
    }
    return acc;
  }, 0);

  const totalPositions = wallets.reduce((acc, w) => {
    return (
      acc +
      (w.portfolio?.total?.totalPositions || w.portfolio?.pools?.reduce((pAcc, p) => pAcc + p.openPositionCount, 0) || 0)
    );
  }, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="border border-[#0D0D0D] p-3 bg-[#F4F4F0]">
          <p className="text-xs uppercase tracking-wider text-[#0D0D0D]/50 mb-1">Total PnL</p>
          <p className={`text-xl font-bold font-mono-jb ${getPnlColor(totalPnL.toString())}`}>
            ${formatNumber(totalPnL.toString())}
          </p>
        </div>
        <div className="border border-[#0D0D0D] p-3 bg-[#F4F4F0]">
          <p className="text-xs uppercase tracking-wider text-[#0D0D0D]/50 mb-1">Total Positions</p>
          <p className="text-xl font-bold font-mono-jb">{totalPositions}</p>
        </div>
        <div className="border border-[#0D0D0D] p-3 bg-[#F4F4F0]">
          <p className="text-xs uppercase tracking-wider text-[#0D0D0D]/50 mb-1">Wallets</p>
          <p className="text-xl font-bold font-mono-jb">{wallets.length}</p>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="border border-[#0D0D0D] bg-[#F4F4F0] overflow-hidden">
        <table className="w-full text-xs font-mono-jb">
          <thead>
            <tr className="bg-[#0D0D0D] text-[#F4F4F0]">
              <th className="px-3 py-2 text-left font-semibold uppercase tracking-wider">Wallet</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Positions</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Total Value</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">Unclaimed Fees</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">PnL</th>
              <th className="px-3 py-2 text-right font-semibold uppercase tracking-wider">PnL %</th>
            </tr>
          </thead>
          <tbody>
            {wallets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#0D0D0D]/50 border-t border-[#0D0D0D]">
                  No wallets registered.
                </td>
              </tr>
            ) : (
              wallets.map((wallet, idx) => {
                const portfolio = wallet.portfolio;
                const total = portfolio?.total;
                const hasData = !!portfolio;

                return (
                  <React.Fragment key={wallet.address}>
                    <tr className={`border-t border-[#0D0D0D] ${idx % 2 === 0 ? 'bg-[#F4F4F0]' : 'bg-[#F4F4F0]/50'}`}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <WalletIcon size={12} className="text-[#0D0D0D]/50" />
                          <div>
                            <code className="text-[10px] break-all">{wallet.address.slice(0, 16)}...</code>
                            {wallet.is_default && (
                              <span className="flex items-center gap-1 mt-1 text-[#FF4500]">
                                <Star size={8} />
                                <span className="text-[10px]">Default</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold">{total?.totalPositions || 0}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${formatNumber(total?.balancesSol || total?.balances)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${formatNumber(total?.unclaimedFeesSol || total?.unclaimedFees)}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${getPnlColor(total?.pnlSol || total?.pnl)}`}>
                        <span className="flex items-center justify-end gap-1">
                          {parseFloat(total?.pnlSol || total?.pnl || '0') >= 0 ? (
                            <TrendingUp size={10} />
                          ) : (
                            <TrendingDown size={10} />
                          )}
                          ${formatNumber(total?.pnlSol || total?.pnl)}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${getPnlColor(total?.pnlSolPctChange || total?.pnlPctChange)}`}
                      >
                        {formatPrice(total?.pnlSolPctChange || total?.pnlPctChange)}%
                      </td>
                    </tr>

                    {/* Expanded Pool Details */}
                    {hasData && portfolio.pools && portfolio.pools.length > 0 && (
                      <tr className="bg-[#0D0D0D]/5">
                        <td colSpan={6} className="px-6 py-3">
                          <div className="text-xs uppercase tracking-wider text-[#0D0D0D]/50 mb-2">Pool Details</div>
                          <div className="space-y-2">
                            {portfolio.pools.map((pool) => (
                              <div key={pool.poolAddress} className="border-l-2 border-[#FF4500] pl-3 py-1">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">
                                      {pool.tokenX}/{pool.tokenY}
                                    </span>
                                    <span className="text-[10px] text-[#0D0D0D]/50">Bin {pool.binStep}</span>
                                    {pool.outOfRange && (
                                      <span className="text-[10px] px-1 py-0.5 bg-red-100 text-red-700 rounded">
                                        Out of Range
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-6 text-xs">
                                    <span>
                                      <span className="text-[#0D0D0D]/50">Pos:</span> {pool.openPositionCount}
                                    </span>
                                    <span>
                                      <span className="text-[#0D0D0D]/50">Value:</span> $
                                      {formatNumber(pool.balancesSol || pool.balances)}
                                    </span>
                                    <span>
                                      <span className="text-[#0D0D0D]/50">Fees:</span> $
                                      {formatNumber(pool.unclaimedFeesSol || pool.unclaimedFees)}
                                    </span>
                                    <span className={getPnlColor(pool.pnl)}>
                                      <span className="text-[#0D0D0D]/50">PnL:</span> ${formatNumber(pool.pnl)}
                                    </span>
                                    <span className={getPnlColor(pool.pnlPctChange)}>{formatPrice(pool.pnlPctChange)}%</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {wallets.length > 0 && (
        <div className="text-xs text-[#0D0D0D]/50">
          <p>
            Showing {wallets.length} wallet{wallets.length !== 1 ? 's' : ''} with portfolio data from Meteora DLMM.
          </p>
        </div>
      )}
    </div>
  );
};
