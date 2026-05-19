import React from 'react';
import { Wallet } from './types';
import { WalletTableRow } from './WalletTableRow';

interface WalletsTableProps {
  wallets: Wallet[];
}

const TABLE_HEADERS = [
  { label: 'Wallet', align: 'left' as const },
  { label: 'Positions', align: 'right' as const },
  { label: 'Total Value', align: 'right' as const },
  { label: 'Unclaimed Fees', align: 'right' as const },
  { label: 'PnL', align: 'right' as const },
  { label: 'PnL %', align: 'right' as const },
];

export const WalletsTable = ({ wallets }: WalletsTableProps) => {
  return (
    <div className="border border-[#0D0D0D] bg-[#F4F4F0] overflow-hidden">
      <table className="w-full text-sm font-mono-jb">
        <thead>
          <tr className="bg-[#0D0D0D] text-[#F4F4F0]">
            {TABLE_HEADERS.map((header) => (
              <th key={header.label} className={`px-3 py-2 text-${header.align} font-semibold uppercase tracking-wider`}>
                {header.label}
              </th>
            ))}
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
            wallets.map((wallet, idx) => (
              <React.Fragment key={wallet.address}>
                <WalletTableRow wallet={wallet} idx={idx} />
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
