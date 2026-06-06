/**
 * @file StrategyBuilderContainer.tsx
 * @description Smart container that wires the API and Zustand store to the UI components, matching the Brutalist app style with simulated tickers.
 *
 * @features
 * - Composes the StepLibrary and PipelineCanvas components inside a split viewport
 * - Implements a live variables simulation runner (cycles prices/indicators for visual testing)
 * - Includes a visual slide-out drawer presenting the formatted Strategy JSON definition for clipboard copy
 * - Strategy selector dropdown to load a saved strategy into the builder canvas
 * - "New Strategy" reset button to clear the canvas
 *
 * @dependencies react, lucide-react, useStrategyApi, useStrategyBuilderStore
 */
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useStrategyApi, StrategySummary } from '../hooks/useStrategyApi';
import { useStrategyBuilderStore } from '../stores/useStrategyBuilderStore';
import { StepLibrary } from '../components/strategies/builder/StepLibrary';
import { PipelineCanvas } from '../components/strategies/builder/PipelineCanvas';
import { StepDescriptor } from '@lp-system/core';
import { Save, AlertCircle, CheckCircle2, ArrowLeft, Terminal, Copy, X, Play, FilePlus, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { SimulationTraceModal } from '../components/strategies/builder/SimulationTraceModal';
import { getTokenSymbol } from '../utils/format';

export function StrategyBuilderContainer({ initialStrategyId }: { initialStrategyId?: string }) {
  const {
    fetchSteps,
    fetchStrategies,
    fetchStrategyById,
    saveStrategy,
    simulateStrategy,
    fetchPoolData,
    error: apiError,
  } = useStrategyApi();
  const [availableSteps, setAvailableSteps] = useState<StepDescriptor[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<StrategySummary[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showExportModal, setShowExportModal] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  const [tokenXSym, setTokenXSym] = useState<string>('Base');
  const [tokenYSym, setTokenYSym] = useState<string>('Quote');
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simIsLoading, setSimIsLoading] = useState(false);
  const [simResult, setSimResult] = useState<unknown>(null);
  const [simTrace, setSimTrace] = useState<unknown[]>([]);
  const [simError, setSimError] = useState<string | null>(null);

  const {
    id,
    name,
    description,
    steps,
    isDirty,
    setMetadata,
    addStep,
    removeStep,
    moveStep,
    updateStepParams,
    getStrategyDefinition,
    simulationConfig,
    setSimulationConfig,
    loadStrategy,
    reset,
  } = useStrategyBuilderStore();

  useEffect(() => {
    fetchSteps().then(setAvailableSteps);
    fetchStrategies().then(setSavedStrategies);
  }, [fetchSteps, fetchStrategies]);

  // Auto-load strategy from ?id=... search param when landing on the builder
  const loadedInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (initialStrategyId && initialStrategyId !== loadedInitialRef.current) {
      loadedInitialRef.current = initialStrategyId;
      setLoadingStrategy(true);
      fetchStrategyById(initialStrategyId)
        .then((def) => {
          if (def) {
            loadStrategy(def);
          } else {
            console.warn(`[StrategyBuilder] Strategy "${initialStrategyId}" not found via API.`);
          }
        })
        .finally(() => setLoadingStrategy(false));
    }
  }, [initialStrategyId, fetchStrategyById, loadStrategy]);

  const contextSetupStep = steps.find((s) => s.stepId === 'context-setup');
  const poolAddress = contextSetupStep?.params?.poolAddress as string;
  const instanceId = contextSetupStep?.instanceId;
  const lastFetchedAddress = useRef<string>('');

  useEffect(() => {
    if (
      poolAddress &&
      poolAddress.length >= 43 &&
      poolAddress.length <= 44 &&
      !poolAddress.includes('mock') &&
      poolAddress !== lastFetchedAddress.current
    ) {
      const timer = setTimeout(async () => {
        const data = await fetchPoolData(poolAddress);
        if (data && data.market && instanceId) {
          lastFetchedAddress.current = poolAddress;
          const symX =
            data.poolInfo?.tokenXSymbol ||
            getTokenSymbol({ mint: data.poolInfo?.tokenXAddress || data.poolInfo?.tokenXMint });
          const symY =
            data.poolInfo?.tokenYSymbol ||
            getTokenSymbol({ mint: data.poolInfo?.tokenYAddress || data.poolInfo?.tokenYMint });
          setTokenXSym(symX);
          setTokenYSym(symY);
          updateStepParams(instanceId, {
            currentPrice: data.market.price,
            rangeMax: parseFloat((data.market.price * 1.1).toFixed(4)),
            rangeMin: parseFloat((data.market.price * 0.9).toFixed(4)),
          });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [poolAddress, instanceId, fetchPoolData, updateStepParams]);

  const handleSave = async () => {
    setSaveStatus('saving');
    const def = getStrategyDefinition();

    if (def.steps.length === 0) {
      alert('Cannot save an empty strategy.');
      setSaveStatus('idle');
      return;
    }

    const success = await saveStrategy(def);
    if (success) {
      setSaveStatus('success');
      // Refresh saved strategies list after save
      fetchStrategies().then(setSavedStrategies);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  const handleLoadStrategy = async (strategyId: string) => {
    if (isDirty && !confirm('You have unsaved changes. Load this strategy and discard them?')) return;
    setLoadingStrategy(true);
    const def = await fetchStrategyById(strategyId);
    if (def) {
      loadStrategy(def);
    } else {
      alert(`Could not load strategy "${strategyId}". It may be a built-in strategy without an editable definition.`);
    }
    setLoadingStrategy(false);
  };

  const handleNewStrategy = () => {
    if (isDirty && !confirm('You have unsaved changes. Start a new strategy and discard them?')) return;
    reset();
  };

  const handleCopyJson = () => {
    const jsonStr = JSON.stringify(getStrategyDefinition(), null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Strategy definition copied to clipboard.');
  };

  const handleSimulate = async () => {
    const def = getStrategyDefinition();
    if (def.steps.length === 0) {
      alert('Cannot simulate an empty strategy.');
      return;
    }

    const targetPool = simulationConfig?.poolAddress || poolAddress;
    const targetPosition = simulationConfig?.positionId || '';

    setShowSimulationModal(true);
    setSimIsLoading(true);
    setSimError(null);
    setSimResult(null);
    setSimTrace([]);

    try {
      const response = await simulateStrategy(def, targetPool, targetPosition);
      if (response && response.trace) {
        setSimResult(response.result);
        setSimTrace(response.trace);
        if (response.error) {
          setSimError(response.error);
        }
      } else {
        setSimError(response?.error || 'Simulation failed to return a trace.');
      }
    } catch (err: unknown) {
      setSimError(err instanceof Error ? err.message : String(err));
    } finally {
      setSimIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:max-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb selection:bg-[#FF4500] selection:text-white flex flex-col relative overflow-hidden">
      {/* Gutter scanline accent */}
      <div className="scanline"></div>

      {/* Top Navbar */}
      <div className="h-16 border-b-2 border-[#0D0D0D] bg-white flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center justify-center p-2 border-2 border-[#0D0D0D] bg-[#F4F4F0] hover:bg-[#0D0D0D] hover:text-white transition-colors shadow-[2px_2px_0_#0D0D0D] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            title="Back to Terminal"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="flex flex-col">
            <input
              type="text"
              value={name}
              onChange={(e) => setMetadata(id, e.target.value, description)}
              className="bg-transparent font-syne font-bold text-lg text-[#0D0D0D] focus:outline-none focus:border-b-2 focus:border-[#FF4500] w-64 placeholder-[#0D0D0D]/50 uppercase tracking-tight"
              placeholder="STRATEGY NAME"
            />
            <input
              type="text"
              value={id}
              onChange={(e) => setMetadata(e.target.value, name, description)}
              className="bg-transparent text-[10px] text-[#0D0D0D]/60 uppercase tracking-widest focus:outline-none focus:text-[#0D0D0D] w-48 mt-0.5 font-bold"
              placeholder="strategy-id"
            />
          </div>

          {/* Strategy Loader Dropdown */}
          <div className="flex items-center gap-2 border-l-2 border-[#0D0D0D] pl-4">
            <div className="relative">
              <select
                id="strategy-loader-select"
                disabled={loadingStrategy}
                onChange={(e) => {
                  if (e.target.value) handleLoadStrategy(e.target.value);
                  e.target.value = '';
                }}
                className="appearance-none bg-[#F4F4F0] border-2 border-[#0D0D0D] px-3 py-1.5 pr-8 text-xs font-bold uppercase text-[#0D0D0D] focus:outline-none focus:border-[#FF4500] cursor-pointer shadow-[2px_2px_0_#0D0D0D] disabled:opacity-50"
                defaultValue=""
                title="Load a saved strategy"
              >
                <option value="" disabled>
                  LOAD STRATEGY…
                </option>
                {savedStrategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
            </div>
            <button
              id="new-strategy-btn"
              onClick={handleNewStrategy}
              title="New strategy (clears canvas)"
              className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#0D0D0D] bg-white hover:bg-[#0D0D0D] hover:text-white font-bold text-xs transition-colors shadow-[2px_2px_0_#0D0D0D] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <FilePlus size={13} />
              NEW
            </button>
          </div>

          <div className="flex flex-col ml-4 border-l-2 border-[#0D0D0D] pl-4">
            <input
              type="text"
              value={simulationConfig?.poolAddress || ''}
              onChange={(e) => setSimulationConfig(e.target.value, simulationConfig?.positionId || '')}
              className="bg-transparent text-xs text-[#0D0D0D] focus:outline-none focus:border-b-2 focus:border-[#FF4500] w-64 placeholder-[#0D0D0D]/50 tracking-tight"
              placeholder="Sim Pool Address (optional)"
            />
            <input
              type="text"
              value={simulationConfig?.positionId || ''}
              onChange={(e) => setSimulationConfig(simulationConfig?.poolAddress || '', e.target.value)}
              className="bg-transparent text-[10px] text-[#0D0D0D]/60 tracking-widest focus:outline-none focus:text-[#0D0D0D] w-64 mt-0.5"
              placeholder="Sim Position ID (optional)"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {apiError && (
            <div className="flex items-center gap-2 text-[#FF4500] text-xs border-2 border-[#FF4500] px-2 py-1 bg-white font-bold">
              <AlertCircle className="w-4 h-4" />
              {apiError}
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-white text-xs border-2 border-[#0D0D0D] px-2 py-1 bg-[#FF4500] font-bold">
              <CheckCircle2 className="w-4 h-4" />
              SAVED
            </div>
          )}

          {/* Export JSON Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#0D0D0D] bg-white hover:bg-[#0D0D0D] hover:text-white font-bold text-xs transition-colors shadow-[3px_3px_0_#0D0D0D] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
          >
            EXPORT JSON
          </button>

          {/* Simulate & Trace Button */}
          <button
            onClick={handleSimulate}
            disabled={steps.length === 0}
            className="flex items-center gap-2 px-4 py-2 border-2 border-[#0D0D0D] bg-[#0D0D0D] text-white hover:bg-gray-800 font-bold text-xs transition-colors shadow-[3px_3px_0_#FF4500] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
          >
            <Play className="w-4 h-4 text-[#FF4500]" />
            SIMULATE & TRACE
          </button>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || steps.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-[#FF4500] hover:bg-[#E03E00] disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:shadow-none text-white border-2 border-[#0D0D0D] font-bold text-xs transition-colors shadow-[3px_3px_0_#0D0D0D] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
          >
            <Save className="w-4 h-4" />
            {saveStatus === 'saving' ? 'SAVING...' : 'SAVE STRATEGY'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        <StepLibrary steps={availableSteps} onAddStep={addStep} />

        <PipelineCanvas
          steps={steps}
          availableDescriptors={availableSteps}
          onMoveStep={moveStep}
          onRemoveStep={removeStep}
          onUpdateStepParams={updateStepParams}
          tokenXSym={tokenXSym}
          tokenYSym={tokenYSym}
        />
      </div>

      {/* Brutalist Export Modal */}
      {showExportModal && (
        <div className="absolute inset-0 bg-[#0D0D0D]/60 flex items-center justify-center z-50 p-6 backdrop-blur-[1px]">
          <div className="bg-white border-2 border-[#0D0D0D] shadow-[8px_8px_0_#0D0D0D] w-full max-w-2xl flex flex-col max-h-[85vh]">
            <div className="bg-[#F4F4F0] border-b-2 border-[#0D0D0D] p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF4500]" />
                <h3 className="font-syne text-sm font-bold text-[#0D0D0D] uppercase tracking-wide">
                  Exported Strategy AST Definition
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-[#0D0D0D] hover:text-white p-1 hover:bg-[#FF4500] border-2 border-[#0D0D0D] bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#F4F4F0]">
              <pre className="bg-[#0D0D0D] text-white p-4 border-2 border-[#0D0D0D] overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[50vh]">
                {JSON.stringify(getStrategyDefinition(), null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t-2 border-[#0D0D0D] bg-white flex justify-end gap-3">
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#0D0D0D] bg-[#FF4500] hover:bg-[#E03E00] text-white font-bold text-xs transition-colors shadow-[3px_3px_0_#0D0D0D] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px]"
              >
                <Copy className="w-3.5 h-3.5" />
                COPY TO CLIPBOARD
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border-2 border-[#0D0D0D] bg-white hover:bg-[#0D0D0D] hover:text-white font-bold text-xs transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Trace Modal */}
      <SimulationTraceModal
        isOpen={showSimulationModal}
        onClose={() => setShowSimulationModal(false)}
        isLoading={simIsLoading}
        result={simResult}
        trace={simTrace}
        error={simError}
      />
    </div>
  );
}
