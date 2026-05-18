/**
 * @file EventLogEntry.tsx
 * @description Renders a single strategy evaluation log entry — timestamp header,
 *              error/result display, price range suggestions, and transaction signatures.
 *
 * @features
 * - Log header with timestamp, action label, and strategy ID
 * - Error state in orange with "!! ERROR" prefix
 * - Result state with action + signal header, reason text, and optional PriceRangeSuggestion
 * - Metrics line at the bottom of the result block
 * - Transaction signatures section for confirmed on-chain operations
 *
 * @sideEffects None
 */

import type { EvalLogEntry } from '../../types/api';
import { PriceRangeSuggestion, type PriceRangeSuggestionProps } from './PriceRangeSuggestion';
import { TransactionSignatures } from './TransactionSignatures';

interface EventLogEntryProps {
  log: EvalLogEntry;
  onApplySuggestion?: (
    positionId: string,
    strategyId: string,
    suggestion: { action: string; openParams?: Record<string, unknown> }
  ) => void;
}

interface ParsedResult {
  action: string;
  signal?: string;
  reason?: string;
  metrics?: string;
  openParams?: Record<string, unknown>;
}

function safeString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseEvalResult(result: unknown): ParsedResult | null {
  try {
    if (!result || typeof result !== 'object') return null;

    const root = (result as Record<string, unknown>).result as Record<string, unknown> | undefined;
    const data = root || (result as Record<string, unknown>);

    return {
      action: String(data.action || 'unknown'),
      signal: safeString(data.signal),
      reason: safeString(data.reason),
      metrics: safeString(data.metrics),
      openParams: data.openParams as Record<string, unknown> | undefined,
    };
  } catch {
    return null;
  }
}

export const EventLogEntry = ({ log, onApplySuggestion }: EventLogEntryProps) => {
  const parsed = log.result ? parseEvalResult(log.result) : null;
  const hasPriceData = parsed?.openParams && parsed.openParams.lowerBoundPrice !== undefined;

  return (
    <div className="w-full min-w-0 border-b border-white/5 pb-1 mb-1 animate-in fade-in slide-in-from-left-2 duration-200">
      {/* Log header: timestamp + action + strategyId */}
      <div className="flex justify-between opacity-60 text-[13px]">
        <span>
          [{log.timestamp}] {log.action?.toUpperCase()}
        </span>
        <span>{log.strategyId || 'SYSTEM'}</span>
      </div>

      {/* Error state */}
      {log.error ? (
        <div className="text-[#FF4500] break-words uppercase font-bold mt-0.5">!! ERROR: {log.error}</div>
      ) : (
        /* Result state */
        <div className="flex flex-col gap-1 mt-0.5">
          {parsed ? (
            <div className="text-green-400 break-words">
              <div className="flex flex-col gap-0.5">
                {/* Action + signal header */}
                <div className="font-bold flex items-center gap-2">
                  <span className="text-[#FF4500]">&gt;&gt;</span>
                  ACTION: {parsed.action.toUpperCase()} {typeof parsed.signal === 'string' && `[${parsed.signal}]`}
                </div>

                {/* Reason text */}
                {typeof parsed.reason === 'string' && (
                  <div className="opacity-80 italic pl-4 border-l border-white/10 mt-0.5">&gt; {parsed.reason}</div>
                )}

                {/* Price range suggestion */}
                {hasPriceData && (
                  <PriceRangeSuggestion
                    openParams={parsed.openParams as PriceRangeSuggestionProps['openParams']}
                    action={parsed.action}
                    positionId={log.positionId}
                    strategyId={log.strategyId}
                    onApplySuggestion={onApplySuggestion}
                  />
                )}
              </div>
            </div>
          ) : log.result && typeof log.result !== 'object' ? (
            /* Plain text result (non-object) */
            <div className="text-green-400 break-words">&gt;&gt; {String(log.result)}</div>
          ) : null}

          {/* Transaction signatures */}
          {log.transactionSignatures && log.transactionSignatures.length > 0 && (
            <TransactionSignatures signatures={log.transactionSignatures} />
          )}
        </div>
      )}
    </div>
  );
};
