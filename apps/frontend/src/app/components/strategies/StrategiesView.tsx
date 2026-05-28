/**
 * @file StrategiesView.tsx
 * @description Dumb component rendering registered strategies in a responsive card grid.
 *
 * @features
 * - Displays each strategy as a card with name, description, risk badge, and ID
 * - Color-codes risk badges (High/red, Medium/black, Low/default)
 * - Empty state when no strategies are registered
 *
 * @sideEffects None
 */

import type { Strategy } from '../../types/api';
import Link from 'next/link';

interface StrategiesViewProps {
  strategies: Strategy[];
}

export const StrategiesView = ({ strategies }: StrategiesViewProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 flex justify-between items-center shrink-0">
        <p className="text-sm text-gray-600">Registered strategies in the system.</p>
        <Link
          href="/strategies/builder"
          className="flex items-center gap-2 px-4 py-2 bg-[#FF4500] hover:bg-[#E03E00] text-[#F4F4F0] border border-[#0D0D0D] font-bold text-sm transition-colors shadow-[2px_2px_0_#0D0D0D] hover:shadow-[1px_1px_0_#0D0D0D] hover:translate-x-[1px] hover:translate-y-[1px]"
        >
          CREATE STRATEGY
        </Link>
      </div>

      {strategies.length === 0 ? (
        <div className="text-gray-500 italic text-sm">No strategies registered in the system.</div>
      ) : (
        <div className="flex-1 overflow-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-4 content-start pb-4">
          {strategies.map((strat: Strategy) => (
            <div
              key={strat.id}
              className="flex flex-col justify-between border border-[#0D0D0D] bg-white p-4 shadow-[4px_4px_0_#0D0D0D]"
            >
              <div>
                <div className="flex items-start justify-between mb-2 gap-2">
                  <h3 className="font-syne text-lg font-bold">{strat.name}</h3>
                  <span
                    className={`text-[13px] px-1.5 py-0.5 uppercase border shrink-0 ${strat.risk === 'High' ? 'border-[#FF4500] text-[#FF4500]' : 'border-[#0D0D0D] text-[#0D0D0D]'}`}
                  >
                    {strat.risk} RISK
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{strat.description}</p>
              </div>
              <div className="text-[13px] mt-4 pt-2 border-t border-gray-200 text-gray-400 font-mono-jb">ID: {strat.id}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
