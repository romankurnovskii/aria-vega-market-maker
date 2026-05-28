/**
 * @file StrategyBuilderContainer.tsx
 * @description Smart container that wires the API and Zustand store to the UI components.
 */
'use client';

import React, { useEffect, useState } from 'react';
import { useStrategyApi } from '../hooks/useStrategyApi';
import { useStrategyBuilderStore } from '../stores/useStrategyBuilderStore';
import { StepLibrary } from '../components/strategies/builder/StepLibrary';
import { PipelineCanvas } from '../components/strategies/builder/PipelineCanvas';
import { StepDescriptor } from '@lp-system/core';
import { Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function StrategyBuilderContainer() {
  const { fetchSteps, saveStrategy, error: apiError } = useStrategyApi();
  const [availableSteps, setAvailableSteps] = useState<StepDescriptor[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const {
    id,
    name,
    description,
    steps,
    setMetadata,
    addStep,
    removeStep,
    moveStep,
    updateStepParams,
    getStrategyDefinition,
  } = useStrategyBuilderStore();

  useEffect(() => {
    fetchSteps().then(setAvailableSteps);
  }, [fetchSteps]);

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
      setTimeout(() => setSaveStatus('idle'), 3000);
    } else {
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-[100dvh] lg:h-screen lg:max-h-screen bg-[#F4F4F0] text-[#0D0D0D] font-mono-jb selection:bg-[#FF4500] selection:text-[#F4F4F0] flex flex-col wireframe-grid relative overflow-hidden">
      <div className="scanline"></div>

      {/* Top Navbar */}
      <div className="h-16 border-b border-[#0D0D0D] bg-[#F4F4F0] flex items-center justify-between px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center justify-center p-2 border border-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-[#F4F4F0] transition-colors"
            title="Back to Terminal"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="flex flex-col">
            <input
              type="text"
              value={name}
              onChange={(e) => setMetadata(id, e.target.value, description)}
              className="bg-transparent font-syne font-bold text-xl text-[#0D0D0D] focus:outline-none focus:border-b-2 focus:border-[#FF4500] w-64 placeholder-[#0D0D0D]/50"
              placeholder="STRATEGY NAME"
            />
            <input
              type="text"
              value={id}
              onChange={(e) => setMetadata(e.target.value, name, description)}
              className="bg-transparent text-[11px] text-[#0D0D0D]/60 uppercase tracking-wider focus:outline-none focus:text-[#0D0D0D] w-48 mt-1"
              placeholder="strategy-id"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {apiError && (
            <div className="flex items-center gap-2 text-[#FF4500] text-sm border border-[#FF4500] px-2 py-1 bg-white">
              <AlertCircle className="w-4 h-4" />
              {apiError}
            </div>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-[#0D0D0D] text-sm border border-[#0D0D0D] px-2 py-1 bg-[#F4F4F0]">
              <CheckCircle2 className="w-4 h-4" />
              SAVED
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || steps.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-[#FF4500] hover:bg-[#E03E00] disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-400 disabled:shadow-none text-[#F4F4F0] border border-[#0D0D0D] font-bold text-sm transition-colors shadow-[4px_4px_0_#0D0D0D] hover:shadow-[2px_2px_0_#0D0D0D] hover:translate-x-[2px] hover:translate-y-[2px]"
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
        />
      </div>
    </div>
  );
}
