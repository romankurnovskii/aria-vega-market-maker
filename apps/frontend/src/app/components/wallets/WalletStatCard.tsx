import React from 'react';
import { getPnlColor, formatNumber } from './utils';

interface WalletStatCardProps {
  label: string;
  value: string | number;
  isPnl?: boolean;
}

export const WalletStatCard = ({ label, value, isPnl }: WalletStatCardProps) => {
  const colorClass = isPnl ? getPnlColor(value) : 'text-[#0D0D0D]';
  const displayValue = isPnl ? `$${formatNumber(value.toString())}` : value;

  return (
    <div className="border border-[#0D0D0D] p-3 bg-[#F4F4F0]">
      <p className="text-xs uppercase tracking-wider text-[#0D0D0D]/50 mb-1">{label}</p>
      <p className={`text-xl font-bold font-mono-jb ${colorClass}`}>{displayValue}</p>
    </div>
  );
};
