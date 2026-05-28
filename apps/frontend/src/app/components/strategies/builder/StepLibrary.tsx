/**
 * @file StepLibrary.tsx
 * @description Sidebar component listing all available StepDescriptors grouped by category.
 */
import { StepDescriptor, StepCategory } from '@lp-system/core';
import { Plus } from 'lucide-react';

interface Props {
  steps: StepDescriptor[];
  onAddStep: (stepId: string, defaultParams?: Record<string, unknown>) => void;
}

export function StepLibrary({ steps, onAddStep }: Props) {
  // Group steps by category
  const grouped = steps.reduce(
    (acc, step) => {
      if (!acc[step.category]) acc[step.category] = [];
      acc[step.category].push(step);
      return acc;
    },
    {} as Record<StepCategory, StepDescriptor[]>
  );

  return (
    <div className="w-80 border-r border-[#0D0D0D] bg-white overflow-y-auto h-full flex flex-col relative z-10">
      <div className="p-4 border-b border-[#0D0D0D] bg-[#F4F4F0]">
        <h2 className="font-syne text-lg font-bold text-[#0D0D0D] uppercase">Step Library</h2>
        <p className="text-xs text-gray-600 font-mono-jb mt-1">Available execution blocks</p>
      </div>

      <div className="p-4 flex-1 space-y-6">
        {Object.entries(grouped).map(([category, categorySteps]) => (
          <div key={category}>
            <h3 className="text-[11px] font-bold text-[#0D0D0D] uppercase tracking-wider mb-3 border-b border-[#0D0D0D] pb-1">
              {category}
            </h3>
            <div className="space-y-3">
              {categorySteps.map((step) => (
                <div
                  key={step.id}
                  className="bg-white border border-[#0D0D0D] p-3 shadow-[2px_2px_0_#0D0D0D] hover:shadow-[4px_4px_0_#0D0D0D] transition-shadow group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-bold text-[#0D0D0D] font-syne">{step.name}</h4>
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
                      className="text-[#0D0D0D] hover:text-white p-1 hover:bg-[#FF4500] border border-transparent hover:border-[#0D0D0D] transition-colors"
                      title="Add to pipeline"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed mb-3 font-mono-jb">{step.description}</p>

                  {/* Mini ports preview */}
                  {(step.inputs.length > 0 || step.outputs.length > 0) && (
                    <div className="flex flex-col gap-1 text-[9px] font-mono-jb text-gray-500">
                      {step.inputs.length > 0 && (
                        <div>
                          <span className="font-bold text-[#0D0D0D]">IN:</span> {step.inputs.map((i) => i.key).join(', ')}
                        </div>
                      )}
                      {step.outputs.length > 0 && (
                        <div>
                          <span className="font-bold text-[#0D0D0D]">OUT:</span> {step.outputs.map((o) => o.key).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {steps.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-sm italic font-mono-jb">Loading steps...</div>
        )}
      </div>
    </div>
  );
}
