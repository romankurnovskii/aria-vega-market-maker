/**
 * @file StepLibrary.tsx
 * @description Sidebar component listing all available StepDescriptors grouped by category, styled with a Brutalist aesthetic and search capability.
 *
 * @features
 * - Displays each step as a sharp Brutalist block card
 * - Categorizes steps and allows filtering via search input
 * - Passes default parameters on step additions
 *
 * @dependencies lucide-react, @lp-system/core
 */
'use client';

import React, { useState } from 'react';
import { StepDescriptor, StepCategory } from '@lp-system/core';
import { Plus, Search } from 'lucide-react';

interface Props {
  steps: StepDescriptor[];
  onAddStep: (stepId: string, defaultParams?: Record<string, unknown>) => void;
}

export function StepLibrary({ steps, onAddStep }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter steps by search query
  const filteredSteps = steps.filter(
    (step) =>
      step.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group steps by category
  const grouped = filteredSteps.reduce(
    (acc, step) => {
      if (!acc[step.category]) acc[step.category] = [];
      acc[step.category].push(step);
      return acc;
    },
    {} as Record<StepCategory, StepDescriptor[]>
  );

  return (
    <div className="w-80 border-r-2 border-[#0D0D0D] bg-[#F4F4F0] overflow-y-auto h-full flex flex-col relative z-10 font-mono-jb">
      {/* Header and Search */}
      <div className="p-4 border-b-2 border-[#0D0D0D] bg-white flex flex-col gap-3">
        <div>
          <h2 className="font-syne text-lg font-bold text-[#0D0D0D] uppercase tracking-wide">Step Library</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Click plus icon to append step to workflow</p>
        </div>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#0D0D0D]/50 absolute left-3" />
          <input
            type="text"
            placeholder="SEARCH STEPS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F4F4F0] border-2 border-[#0D0D0D] pl-9 pr-3 py-1.5 text-xs font-bold text-[#0D0D0D] focus:outline-none focus:bg-white placeholder-[#0D0D0D]/40 uppercase"
          />
        </div>
      </div>

      <div className="p-4 flex-1 space-y-6 overflow-y-auto">
        {Object.entries(grouped).map(([category, categorySteps]) => (
          <div key={category}>
            <h3 className="text-[11px] font-bold text-white bg-[#0D0D0D] px-2 py-1 uppercase tracking-wider mb-3 inline-block">
              {category}
            </h3>
            <div className="space-y-3">
              {categorySteps.map((step) => (
                <div
                  key={step.id}
                  className="bg-white border-2 border-[#0D0D0D] p-3 shadow-[3px_3px_0_#0D0D0D] hover:shadow-[5px_5px_0_#FF4500] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-[#0D0D0D] font-syne uppercase tracking-tight">{step.name}</h4>
                    <button
                      onClick={() => {
                        const defaults = step.params.reduce(
                          (acc, p) => {
                            if (p.default !== undefined) acc[p.key] = p.default;
                            return acc;
                          },
                          {} as Record<string, unknown>
                        );
                        onAddStep(step.id, defaults);
                      }}
                      className="text-[#0D0D0D] hover:text-white p-1 hover:bg-[#FF4500] border-2 border-[#0D0D0D] bg-[#F4F4F0] transition-colors shadow-[2px_2px_0_#0D0D0D] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                      title="Add to pipeline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-[#0D0D0D]/70 leading-relaxed mb-3 font-medium">{step.description}</p>

                  {/* Mini ports preview */}
                  {(step.inputs.length > 0 || step.outputs.length > 0) && (
                    <div className="flex flex-col gap-1 text-[9px] text-[#0D0D0D]/60 border-t border-[#0D0D0D]/10 pt-2">
                      {step.inputs.length > 0 && (
                        <div>
                          <span className="font-bold text-[#0D0D0D] uppercase">IN:</span>{' '}
                          {step.inputs.map((i) => i.key).join(', ')}
                        </div>
                      )}
                      {step.outputs.length > 0 && (
                        <div>
                          <span className="font-bold text-[#0D0D0D] uppercase">OUT:</span>{' '}
                          {step.outputs.map((o) => o.key).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {filteredSteps.length === 0 && (
          <div className="text-center text-[#0D0D0D]/50 py-8 text-xs italic">No matching step types found</div>
        )}
      </div>
    </div>
  );
}
