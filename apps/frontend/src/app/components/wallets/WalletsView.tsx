/**
 * @file WalletsView.tsx
 * @description Displays wallet list with portfolio data including balances, PnL, and position counts.
 */

import React from 'react';
import { WalletStatCard } from './WalletStatCard';
import { WalletsTable } from './WalletsTable';
import { Wallet } from './types';

interface WalletsViewProps {
  wallets: Wallet[];
}

export const WalletsView = ({ wallets }: WalletsViewProps) => {
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
        <WalletStatCard label="Total PnL" value={totalPnL} isPnl />
        <WalletStatCard label="Total Positions" value={totalPositions} />
        <WalletStatCard label="Wallets" value={wallets.length} />
      </div>

      {/* Wallets Table */}
      <WalletsTable wallets={wallets} />

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
