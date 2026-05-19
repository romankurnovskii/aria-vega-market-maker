import React from 'react';
import { Wallet } from './types';
import { formatNumber, getPnlColor } from './utils';
import { TrendingUp, TrendingDown, Wallet as WalletIcon, Star } from 'lucide-react';

interface WalletTableRowProps {
  wallet: Wallet;
  idx: number;
}

export const WalletTableRow = ({ wallet, idx }: WalletTableRowProps) => {
  const portfolio = wallet.portfolio;
  const total = portfolio?.total;
  const hasData = !!portfolio;

  return (
    <>
      <tr className={`border-t border-[#0D0D0D] ${idx % 2 === 0 ? 'bg-[#F4F4F0]' : 'bg-[#F4F4F0]/50'}`}>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <WalletIcon size={12} className="text-[#0D0D0D]/50" />
            <div>
              <code className="text-[12px] break-all">{wallet.address}</code>
              {wallet.is_default && (
                <span className="flex items-center gap-1 mt-1 text-[#FF4500]">
                  <Star size={8} />
                  <span className="text-[12px]">Default</span>
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-3 py-2 text-right font-semibold">{total?.totalPositions || 0}</td>
        <td className="px-3 py-2 text-right font-mono">${formatNumber(total?.balancesSol || total?.balances)}</td>
        <td className="px-3 py-2 text-right font-mono">${formatNumber(total?.unclaimedFeesSol || total?.unclaimedFees)}</td>
        <td className={`px-3 py-2 text-right font-mono ${getPnlColor(total?.pnlSol || total?.pnl)}`}>
          <span className="flex items-center justify-end gap-1">
            {parseFloat(total?.pnlSol || total?.pnl || '0') >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}$
            {formatNumber(total?.pnlSol || total?.pnl)}
          </span>
        </td>
        <td className={`px-3 py-2 text-right font-mono ${getPnlColor(total?.pnlSolPctChange || total?.pnlPctChange)}`}>
          {formatNumber(total?.pnlSolPctChange || total?.pnlPctChange)}%
        </td>
      </tr>
      {hasData && portfolio?.pools && portfolio.pools.length > 0 && (
        <tr className="bg-[#0D0D0D]/5">
          <td colSpan={6} className="px-6 py-3">
            <div className="text-sm uppercase tracking-wider text-[#0D0D0D]/50 mb-2">Pool Details</div>
            <div className="space-y-2">
              {portfolio.pools.map((pool) => (
                <div key={pool.poolAddress} className="border-l-2 border-[#FF4500] pl-3 py-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {pool.tokenX}/{pool.tokenY}
                      </span>
                      <span className="text-[12px] text-[#0D0D0D]/50">Bin {pool.binStep}</span>
                      {pool.outOfRange && (
                        <span className="text-[12px] px-1 py-0.5 bg-red-100 text-red-700 rounded">Out of Range</span>
                      )}
                    </div>
                    <div className="flex gap-6 text-sm">
                      <span>
                        <span className="text-[#0D0D0D]/50">Pos:</span> {pool.openPositionCount}
                      </span>
                      <span>
                        <span className="text-[#0D0D0D]/50">Value:</span> ${formatNumber(pool.balancesSol || pool.balances)}
                      </span>
                      <span>
                        <span className="text-[#0D0D0D]/50">Fees:</span> $
                        {formatNumber(pool.unclaimedFeesSol || pool.unclaimedFees)}
                      </span>
                      <span className={getPnlColor(pool.pnl)}>
                        <span className="text-[#0D0D0D]/50">PnL:</span> ${formatNumber(pool.pnl)}
                      </span>
                      <span className={getPnlColor(pool.pnlPctChange)}>{formatNumber(pool.pnlPctChange)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
