/**
 * @file EventLog.tsx
 * @description Presentational component for displaying strategy event logs.
 * @features
 * - Live CRT terminal styling
 * - Error highlighting in orange/red
 * - Success output in green
 * - Timestamp and strategy ID headers
 */

'use client';

import React from 'react';

interface LogEntry {
  id: string | number;
  timestamp: string;
  action?: string;
  strategyId?: string;
  positionId?: string;
  error?: string;
  result?: unknown;
  transactionSignatures?: string[];
  pendingSuggestion?: {
    action: string;
    openParams?: Record<string, unknown>;
  };
}

interface EventLogProps {
  logs: LogEntry[];
  onApplySuggestion?: (positionId: string, strategyId: string, suggestion: { action: string; openParams?: Record<string, unknown> }) => void;
}

export const EventLog = ({ logs, onApplySuggestion }: EventLogProps) => {
  return (
    <div className="flex-1 border border-[#0D0D0D] bg-[#0D0D0D] text-[#F4F4F0] p-4 font-mono text-[11px] overflow-hidden flex flex-col min-h-0 relative">
      <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none uppercase tracking-tighter text-xs">
        Live CRT Terminal
      </div>
      <div className="flex items-center gap-2 border-b border-[#F4F4F0]/20 pb-2 mb-2 shrink-0">
        <div className="w-2 h-2 bg-[#FF4500] animate-pulse"></div>
        <span className="uppercase font-bold tracking-widest text-[#FF4500]">Strategy Event Log</span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-gray-500 italic opacity-50">No events recorded. Click "Evaluate Ad-Hoc" to trigger.</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="border-b border-white/5 pb-1 mb-1 animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <div className="flex justify-between opacity-60 text-[11px]">
                <span>
                  [{log.timestamp}] {log.action?.toUpperCase()}
                </span>
                <span>{log.strategyId || 'SYSTEM'}</span>
              </div>
              {log.error ? (
                <div className="text-[#FF4500] break-words uppercase font-bold mt-0.5">!! ERROR: {log.error}</div>
              ) : (
                <div className="flex flex-col gap-1 mt-0.5">
                  <div className="text-green-400 break-words">
                    {(() => {
                      if (!log.result) return '';
                      if (typeof log.result !== 'object') return `>> ${log.result}`;

                      const res = (log.result as Record<string, unknown>)?.result || log.result;
                      const action = (res as Record<string, unknown>).action || 'unknown';
                      const signal = (res as Record<string, unknown>).signal || '';
                      const reason = (res as Record<string, unknown>).reason || '';
                      const metrics = (res as Record<string, unknown>).metrics
                        ? ` | METRICS: ${JSON.stringify((res as Record<string, unknown>).metrics)}`
                        : '';

                      const openParams = (res as Record<string, unknown>).openParams as Record<string, unknown> | undefined;
                      const hasPriceData = openParams && openParams.lowerBoundPrice !== undefined;

                      return (
                        <div className="flex flex-col gap-0.5">
                          <div className="font-bold flex items-center gap-2">
                            <span className="text-[#FF4500]">&gt;&gt;</span>
                            ACTION: {String(action).toUpperCase()} {signal && `[${signal}]`}
                          </div>

                          {reason && (
                            <div className="opacity-80 italic pl-4 border-l border-white/10 mt-0.5">
                              &gt; {String(reason)}
                            </div>
                          )}

                          {hasPriceData && (
                            <div className="mt-2 mb-2 bg-white/5 p-2 border-l-2 border-[#FF4500] flex flex-col gap-2 rounded-sm shadow-inner">
                              <div className="text-[11px] uppercase font-bold text-[#FF4500] opacity-80 tracking-widest border-b border-white/10 pb-1 flex justify-between items-center">
                                <span>Proposed Price Range</span>
                                {onApplySuggestion && log.positionId && log.strategyId && action !== 'skip' && (
                                  <button
                                    onClick={() => onApplySuggestion(log.positionId!, log.strategyId!, {
                                      action: String(action),
                                      openParams
                                    })}
                                    className="bg-[#FF4500] text-[#F4F4F0] px-2 py-0.5 text-[10px] hover:bg-[#FF4500]/80 transition-colors uppercase font-bold rounded-sm"
                                  >
                                    Apply Suggestion
                                  </button>
                                )}
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <div className="flex flex-col">
                                  <span className="opacity-50 uppercase text-[11px] tracking-tighter">Lower Price</span>
                                  <span className="font-bold text-[11px] text-[#F4F4F0]">
                                    {Number(openParams.lowerBoundPrice).toLocaleString(undefined, {
                                      minimumFractionDigits: 4,
                                      maximumFractionDigits: 6,
                                    })}
                                  </span>
                                </div>
                                <div className="h-6 w-px bg-white/10 mx-2"></div>
                                <div className="flex flex-col">
                                  <span className="opacity-50 uppercase text-[11px] tracking-tighter">Upper Price</span>
                                  <span className="font-bold text-[11px] text-[#F4F4F0]">
                                    {Number(openParams.upperBoundPrice).toLocaleString(undefined, {
                                      minimumFractionDigits: 4,
                                      maximumFractionDigits: 6,
                                    })}
                                  </span>
                                </div>
                                <div className="h-6 w-px bg-white/10 mx-2"></div>
                                <div className="flex flex-col text-right">
                                  <span className="opacity-50 uppercase text-[11px] tracking-tighter">Range Width</span>
                                  <span className="font-bold text-[11px] text-green-400">
                                    {(Number(openParams.rangePercent) || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                              <div className="text-[11px] opacity-40 uppercase tracking-tighter flex justify-between border-t border-white/5 pt-1">
                                <span>Bins: {String(openParams.binCount || 'unknown')}</span>
                                <span>
                                  Slippage:{' '}
                                  {String((openParams.metadata as Record<string, unknown>)?.slippageTolerance || '50')} bps
                                </span>
                              </div>
                            </div>
                          )}

                          {metrics && <div className="text-[11px] opacity-20 truncate mt-1">{metrics}</div>}
                        </div>
                      );
                    })()}
                  </div>
                  {log.transactionSignatures && log.transactionSignatures.length > 0 && (
                    <div className="bg-[#1A1A1A] p-1 border-l-2 border-green-500 text-[11px] flex flex-col gap-0.5">
                      <div className="font-bold text-green-500 uppercase">TX CONFIRMED:</div>
                      {log.transactionSignatures.map((sig, idx) => (
                        <div key={idx} className="opacity-70 break-all select-all">
                          {sig}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
