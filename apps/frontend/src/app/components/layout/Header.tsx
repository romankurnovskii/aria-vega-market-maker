/**
 * @file Header.tsx
 * @description Presentational component for the top app bar — displays health status,
 *              epoch counter, assignment count, and wallet count with icon badges.
 *
 * @features
 * - Shows live health indicator dot (green/red)
 * - Displays epoch, assignments, and wallets summary badges
 * - Purely presentational — all data received via props
 *
 * @dependencies api types (HealthData, Assignment, Wallet)
 */

import type { HealthData, Assignment } from '../../types/api';

interface Wallet {
  chain: string;
  address: string;
  is_default: boolean;
}

interface HeaderProps {
  health: HealthData;
  assignments: Assignment[];
  wallets: Wallet[];
}

const addrShort = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

export const Header = ({ health, assignments, wallets }: HeaderProps) => {
  return (
    <header className="border-b border-[#0D0D0D] pb-2 mb-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10 shrink-0">
      <div className="flex flex-col">
        <h1 className="font-syne text-2xl md:text-3xl font-extrabold uppercase leading-none tracking-tighter">
          Aria Vega{' '}
          <span className="text-transparent" style={{ WebkitTextStroke: '1px #0D0D0D' }}>
            Control
          </span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-4 md:gap-6 text-sm border-t md:border-t-0 md:border-l border-[#0D0D0D] pt-2 md:pt-0 md:pl-4 w-full md:w-auto">
        {wallets.length > 0 && (
          <div>
            <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[13px]">Wallets</div>
            <div className="flex flex-col gap-0.5">
              {wallets.map((w) => (
                <div key={w.address} className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${w.is_default ? 'bg-[#FF4500]' : 'bg-gray-300'}`} />
                  <span className="font-mono font-bold">{addrShort(w.address)}</span>
                  <span className="text-gray-400 uppercase text-[12px]">{w.chain}</span>
                  {w.is_default && <span className="text-[12px] text-[#FF4500] font-bold ml-auto">DEFAULT</span>}
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[13px]">Epoch</div>
          <div className="font-bold">{health.epoch}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[13px]">Active Tasks</div>
          <div className="font-bold">{assignments.length}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[13px]">Engine Status</div>
          <div className={`font-bold uppercase ${health.status === 'healthy' ? 'text-green-600' : 'text-[#FF4500]'}`}>
            {health.status}
          </div>
        </div>
      </div>
    </header>
  );
};
