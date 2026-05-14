/**
 * @file Header.tsx
 * @description Compact header displaying epoch, active task count, and engine health status.
 *
 * @features
 * - Shows current epoch timestamp
 * - Shows number of active assignments
 * - Shows engine status with color indicator
 *
 * @dependencies HealthData, Assignment (AriaVegaContainer)
 */

import type { HealthData, Assignment } from '../containers/AriaVegaContainer';

interface HeaderProps {
  health: HealthData;
  assignments: Assignment[];
}

export const Header = ({ health, assignments }: HeaderProps): JSX.Element => {
  return (
    <header className="border-b border-[#0D0D0D] pb-2 mb-4 flex flex-row justify-between items-end gap-4 relative z-10 shrink-0">
      <h1 className="font-syne text-2xl md:text-3xl font-extrabold uppercase leading-none tracking-tighter">
        Aria Vega{' '}
        <span className="text-transparent" style={{ WebkitTextStroke: '1px #0D0D0D' }}>
          Control
        </span>
      </h1>

      <div className="flex gap-6 text-xs border-l border-[#0D0D0D] pl-4">
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Epoch</div>
          <div className="font-bold">{health.epoch}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Active Tasks</div>
          <div className="font-bold">{assignments.length}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5 uppercase tracking-wider text-[10px]">Engine Status</div>
          <div className={`font-bold uppercase ${health.status === 'healthy' ? 'text-green-600' : 'text-[#FF4500]'}`}>
            {health.status}
          </div>
        </div>
      </div>
    </header>
  );
};