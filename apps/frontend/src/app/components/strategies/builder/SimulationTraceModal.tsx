import React from 'react';
import { X, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface SimulationTraceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  result: unknown;
  trace: unknown[];
  error?: string | null;
}

export function SimulationTraceModal({ isOpen, onClose, isLoading, result, trace, error }: SimulationTraceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-[#0D0D0D] shadow-[8px_8px_0_#FF4500] w-full max-w-4xl max-h-[90vh] flex flex-col font-mono-jb">
        {/* Header */}
        <div className="flex justify-between items-center bg-[#0D0D0D] text-white p-4 border-b-2 border-[#0D0D0D]">
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-[#FF4500]" />
            <h2 className="font-syne font-bold uppercase tracking-wide">Simulation Trace</h2>
          </div>
          <button onClick={onClose} className="hover:text-[#FF4500] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#F4F4F0] relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4F4F0]/80 z-10 backdrop-blur-sm">
              <div className="w-8 h-8 border-4 border-[#0D0D0D] border-t-[#FF4500] rounded-full animate-spin mb-4" />
              <p className="font-bold animate-pulse text-[#0D0D0D] uppercase text-sm tracking-widest">
                Executing Pipeline...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 border-2 border-red-500 bg-red-50 text-red-700 flex items-start gap-3 shadow-[4px_4px_0_#ef4444]">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold uppercase text-sm mb-1">Simulation Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && result && (
            <div className="space-y-6">
              {/* Result Summary */}
              <div className="p-4 bg-white border-2 border-[#0D0D0D] shadow-[4px_4px_0_#0D0D0D]">
                <h3 className="text-sm font-bold uppercase border-b-2 border-[#0D0D0D]/10 pb-2 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Final Result
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Signal</div>
                    <div className={`font-bold ${result._signal === 'close+open' ? 'text-[#FF4500]' : 'text-[#0D0D0D]'}`}>
                      {result._signal || result.signal || 'SKIP'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Reason</div>
                    <div className="text-sm">{result._reason || result.reason || 'None provided'}</div>
                  </div>
                </div>
              </div>

              {/* Step Trace */}
              <div>
                <h3 className="text-sm font-bold uppercase mb-4 pl-1 border-l-4 border-[#FF4500]">Execution Trace</h3>

                {trace.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No steps executed.</p>
                ) : (
                  <div className="space-y-4">
                    {trace.map((t, idx) => (
                      <div key={idx} className="bg-white border-2 border-[#0D0D0D] group">
                        <div className="bg-[#0D0D0D]/5 px-3 py-2 border-b-2 border-[#0D0D0D] flex justify-between items-center">
                          <span className="font-bold text-sm">
                            <span className="text-[#FF4500] mr-2">[{idx + 1}]</span>
                            {t.stepName || t.stepId}
                          </span>
                          {t.error && (
                            <span className="text-xs font-bold text-red-600 uppercase bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                              Error
                            </span>
                          )}
                        </div>
                        <div className="p-3 text-xs overflow-x-auto bg-[#FAFAFA]">
                          {t.error && (
                            <div className="mb-3 p-2 bg-red-50 text-red-700 border border-red-200 rounded">
                              <span className="font-bold block mb-1">Step Error:</span>
                              {t.error}
                            </div>
                          )}
                          <div className="flex flex-col gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Context Before:
                              </span>
                              <pre className="text-[10px] text-[#0D0D0D] bg-white border border-gray-200 p-2 overflow-x-auto">
                                {JSON.stringify(t.contextBefore, null, 2)}
                              </pre>
                            </div>
                            {t.contextAfter && (
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Context After:
                                </span>
                                <pre className="text-[10px] text-[#0D0D0D] bg-white border border-gray-200 p-2 overflow-x-auto border-l-4 border-l-green-400">
                                  {JSON.stringify(t.contextAfter, null, 2)}
                                </pre>
                              </div>
                            )}
                            {t.result && (
                              <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Step Result:
                                </span>
                                <pre className="text-[10px] text-[#0D0D0D] bg-white border border-gray-200 p-2 overflow-x-auto border-l-4 border-l-blue-400">
                                  {JSON.stringify(t.result, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#0D0D0D] bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#0D0D0D] text-white font-bold uppercase text-sm hover:bg-[#FF4500] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
