/**
 * @file EventLog.tsx
 * @description Dumb component that renders the scrollable event log terminal display.
 *
 * @features
 * - Renders timestamped log entries in a monospace terminal-style container
 * - Newest entry is visually distinct (white text vs gray for older entries)
 * - Auto-scrolls via CSS overflow; shows blinking cursor indicator
 *
 * @sideEffects None
 */

interface EventLogProps {
  events: string[];
}

export const EventLog = ({ events }: EventLogProps): JSX.Element => {
  return (
    <div className="flex-1 bg-[#0D0D0D] p-4 text-[#F4F4F0] font-mono-jb text-[10px] leading-relaxed border border-[#0D0D0D] overflow-y-auto flex flex-col min-h-[150px]">
      <div className="flex items-center gap-2 text-[#FF4500] mb-3 border-b border-gray-800 pb-2 shrink-0">
        <TerminalSquare size={14} />
        <span className="uppercase tracking-widest text-[10px]">Position Events</span>
      </div>
      <div className="space-y-2 flex-1">
        {events.map((log: string, i: number) => (
          <div key={i} className={`${i === 0 ? 'text-[#F4F4F0]' : 'text-gray-500'}`}>
            {log}
          </div>
        ))}
        <div className="text-gray-700 animate-pulse mt-2">_</div>
      </div>
    </div>
  );
};