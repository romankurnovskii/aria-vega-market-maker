/**
 * @file EventLogHeader.tsx
 * @description Collapse/expand toggle header for the strategy event log panel.
 *              Purely presentational — renders two visual states based on collapsed prop.
 *
 * @features
 * - Collapsed state: compact single-button bar with play icon
 * - Expanded state: header row with terminal branding, collapse toggle
 * - Live CRT Terminal watermark decoration (expanded only)
 */

interface EventLogHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const EventLogHeader = ({ collapsed, onToggle }: EventLogHeaderProps) => {
  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="border border-[#0D0D0D] bg-[#0D0D0D] text-[#F4F4F0] px-4 py-2 font-mono text-[13px] flex items-center gap-2 w-full text-left cursor-pointer shrink-0"
      >
        <div className="w-2 h-2 bg-[#FF4500] shrink-0"></div>
        <span className="uppercase font-bold tracking-widest text-[#FF4500]">Strategy Event Log</span>
        <span className="ml-auto text-[#F4F4F0]/40 text-sm">{'\u25B6'}</span>
      </button>
    );
  }

  return (
    <>
      <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none uppercase tracking-tighter text-sm">
        Live CRT Terminal
      </div>
      <button
        onClick={onToggle}
        className="flex items-center gap-2 border-b border-[#F4F4F0]/20 pb-2 mb-2 shrink-0 w-full text-left cursor-pointer bg-transparent border-t-0 border-r-0 border-l-0"
      >
        <div className="w-2 h-2 bg-[#FF4500] animate-pulse shrink-0"></div>
        <span className="uppercase font-bold tracking-widest text-[#FF4500]">Strategy Event Log</span>
        <span className="ml-auto text-[#F4F4F0]/40 text-sm">{'\u25BC'}</span>
      </button>
    </>
  );
};
