/**
 * @file PriceRangeSuggestion.tsx
 * @description Displays a proposed price range from a strategy evaluation result,
 *              with an "Apply Suggestion" action button.
 *
 * @features
 * - Orange-accented panel with lower/upper price, range width, bins, and slippage
 * - Conditional "Apply Suggestion" button wired to parent callback
 * - Responsive 3-column grid collapsing to stacked on small screens
 *
 * @sideEffects None — mutation flows through onApplySuggestion callback
 */

export interface PriceRangeSuggestionProps {
  openParams: {
    lowerBoundPrice?: number;
    upperBoundPrice?: number;
    rangePercent?: number;
    binCount?: string | number;
    metadata?: { slippageTolerance?: number };
  };
  action: string;
  positionId?: string;
  strategyId?: string;
  onApplySuggestion?: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => void;
}

export const PriceRangeSuggestion = ({
  openParams,
  action,
  positionId,
  strategyId,
  onApplySuggestion,
}: PriceRangeSuggestionProps) => {
  const showApplyButton = onApplySuggestion && positionId && strategyId && action !== 'skip';

  return (
    <div className="mt-2 mb-2 bg-white/5 p-2 border-l-2 border-[#FF4500] flex flex-col gap-2 rounded-sm shadow-inner min-w-0 overflow-hidden">
      <div className="text-[11px] uppercase font-bold text-[#FF4500] opacity-80 tracking-widest border-b border-white/10 pb-1 flex flex-wrap justify-between items-center gap-2">
        <span>Proposed Price Range</span>
        {showApplyButton && (
          <button
            onClick={() =>
              onApplySuggestion!(positionId!, strategyId!, {
                action: String(action),
                openParams: openParams as Record<string, unknown>,
              })
            }
            className="bg-[#FF4500] text-[#F4F4F0] px-2 py-0.5 text-[10px] hover:bg-[#FF4500]/80 transition-colors uppercase font-bold rounded-sm whitespace-nowrap"
          >
            Apply Suggestion
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-1">
        <div className="flex flex-col min-w-0">
          <span className="opacity-50 uppercase text-[10px] tracking-tighter truncate">Lower</span>
          <span className="font-bold text-[11px] text-[#F4F4F0] truncate">
            {Number(openParams.lowerBoundPrice).toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 6,
            })}
          </span>
        </div>
        <div className="flex flex-col min-w-0 sm:border-l sm:border-white/10 sm:pl-2">
          <span className="opacity-50 uppercase text-[10px] tracking-tighter truncate">Upper</span>
          <span className="font-bold text-[11px] text-[#F4F4F0] truncate">
            {Number(openParams.upperBoundPrice).toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 6,
            })}
          </span>
        </div>
        <div className="flex flex-col min-w-0 sm:border-l sm:border-white/10 sm:pl-2 sm:text-right">
          <span className="opacity-50 uppercase text-[10px] tracking-tighter truncate">Width</span>
          <span className="font-bold text-[11px] text-green-400 truncate">
            {(Number(openParams.rangePercent) || 0).toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="text-[10px] opacity-40 uppercase tracking-tighter flex flex-wrap justify-between border-t border-white/5 pt-1 gap-2">
        <span>Bins: {String(openParams.binCount || 'unknown')}</span>
        <span>Slippage: {String(openParams.metadata?.slippageTolerance || '50')} bps</span>
      </div>
    </div>
  );
};
