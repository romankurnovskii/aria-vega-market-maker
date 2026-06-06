/**
 * @file PipelineCanvas.tsx
 * @description Drag-and-drop sortable canvas containing the strategy steps, with visual wire annotations, inline insert triggers, and a Live Variable HUD.
 *
 * @features
 * - Sequential step layout with Dnd-Kit vertical sorting
 * - Shows visual SVG wire tracks running down the left gutter to represent sequential execution pathing
 * - Renders inline Quick-Add button dividers between step cards for on-the-fly step injection
 * - Includes a togglable 'Live Variable Context Explorer' sidebar on the right displaying simulated variables
 *
 * @dependencies @dnd-kit/core, @dnd-kit/sortable, lucide-react, @lp-system/core
 */
'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StepDescriptor, StrategyDefinitionStep } from '@lp-system/core';
import { PipelineStepCard } from './PipelineStepCard';
import { Plus } from 'lucide-react';
import { useStrategyBuilderStore } from '../../../stores/useStrategyBuilderStore';

interface StepInstance {
  instanceId: string;
  stepId: string;
  params: Record<string, unknown>;
  runIf?: StrategyDefinitionStep['runIf'];
}

interface Props {
  steps: StepInstance[];
  availableDescriptors: StepDescriptor[];
  onMoveStep: (oldIndex: number, newIndex: number) => void;
  onRemoveStep: (instanceId: string) => void;
  onUpdateStepParams: (instanceId: string, params: Record<string, unknown>) => void;
  onUpdateStepRunIf: (instanceId: string, runIf: StrategyDefinitionStep['runIf'] | undefined) => void;
  tokenXSym?: string;
  tokenYSym?: string;
}

export function PipelineCanvas({
  steps,
  availableDescriptors,
  onMoveStep,
  onRemoveStep,
  onUpdateStepParams,
  onUpdateStepRunIf,
  tokenXSym,
  tokenYSym,
}: Props) {
  const [quickAddMenuIndex, setQuickAddMenuIndex] = useState<number | null>(null);

  const insertStep = useStrategyBuilderStore((s) => s.insertStep);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.instanceId === active.id);
      const newIndex = steps.findIndex((s) => s.instanceId === over.id);
      onMoveStep(oldIndex, newIndex);
    }
  };

  const handleQuickAdd = (stepId: string, index: number) => {
    const descriptor = availableDescriptors.find((d) => d.id === stepId);
    const defaults = descriptor
      ? descriptor.params.reduce(
          (acc, p) => {
            if (p.default !== undefined) acc[p.key] = p.default;
            return acc;
          },
          {} as Record<string, unknown>
        )
      : {};
    insertStep(stepId, index, defaults);
    setQuickAddMenuIndex(null);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative z-10 font-mono-jb bg-[#F4F4F0] wireframe-grid">
      {/* Gutter scanline accent */}
      <div className="scanline"></div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-6 overflow-y-auto min-w-0">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8 border-b-2 border-[#0D0D0D] pb-4 flex justify-between items-end">
            <div>
              <h1 className="font-syne text-2xl font-bold text-[#0D0D0D] uppercase tracking-wide">Execution Flow</h1>
              <p className="text-[#0D0D0D]/60 text-[11px] mt-1">
                Nodes evaluate sequentially. Connecting wires indicate context inheritance.
              </p>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="border-2 border-dashed border-[#0D0D0D] bg-white p-12 text-center shadow-[4px_4px_0_#0D0D0D] flex flex-col items-center justify-center gap-4">
              <p className="text-xs text-[#0D0D0D]/50 uppercase font-bold">No steps defined inside pipeline canvas.</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {availableDescriptors.slice(0, 4).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleQuickAdd(d.id, 0)}
                    className="px-3 py-1.5 border-2 border-[#0D0D0D] bg-[#FF4500] hover:bg-[#E03E00] text-white text-[10px] font-bold shadow-[2px_2px_0_#0D0D0D] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase"
                  >
                    + ADD {d.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative pl-8">
              {/* Vertical SVG Flow Wire Track (Left Side Gutter) */}
              <div className="absolute left-[13px] top-4 bottom-4 w-1 flex justify-center z-0">
                <svg className="h-full w-4 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                  <line x1="2" y1="0" x2="2" y2="100%" stroke="#0D0D0D" strokeWidth="3" strokeDasharray="6 4" />
                </svg>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={steps.map((s) => s.instanceId)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {/* Top Quick Add Trigger */}
                    <div className="relative h-6 flex items-center justify-center group z-10">
                      <div className="absolute inset-x-0 h-0.5 bg-dashed border-t-2 border-dashed border-[#0D0D0D]/20 group-hover:border-[#FF4500] transition-colors" />
                      <button
                        onClick={() => setQuickAddMenuIndex(0)}
                        className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-[#0D0D0D] flex items-center justify-center text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white transition-all shadow-[1px_1px_0_#0D0D0D] group-hover:scale-110"
                        title="Insert step at start"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>

                      {quickAddMenuIndex === 0 && (
                        <div className="absolute top-8 bg-white border-2 border-[#0D0D0D] shadow-[4px_4px_0_#0D0D0D] p-2 z-30 flex flex-col gap-1 w-52 max-h-60 overflow-y-auto">
                          <div className="text-[9px] font-bold text-gray-500 uppercase pb-1 border-b border-gray-200">
                            Select Step to Insert:
                          </div>
                          {availableDescriptors.map((d) => (
                            <button
                              key={d.id}
                              onClick={() => handleQuickAdd(d.id, 0)}
                              className="text-left px-2 py-1 text-[10px] font-bold text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white uppercase"
                            >
                              {d.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {steps.map((step, idx) => {
                      const descriptor = availableDescriptors.find((d) => d.id === step.stepId);
                      if (!descriptor) return null;

                      // Dynamically compute variables available up to this point in execution sequence
                      const precedingVariables = [
                        { value: 'Price_SOL', label: 'SOL RATE (Price_SOL)' },
                        { value: 'UserBalanceUSDC', label: 'USDC BALANCE (UserBalanceUSDC)' },
                        { value: 'UserBalanceETH', label: 'ETH BALANCE (UserBalanceETH)' },
                        { value: 'MeteoraStatus', label: 'METEORA POOL STATUS (MeteoraStatus)' },
                        { value: 'Signal', label: 'CROSSOVER SIGNAL (Signal)' },
                      ];

                      for (let i = 0; i < idx; i++) {
                        const prevStep = steps[i];
                        const prevDesc = availableDescriptors.find((d) => d.id === prevStep.stepId);

                        // 1. Add static outputs declared in the step's descriptor
                        if (prevDesc?.outputs) {
                          prevDesc.outputs.forEach((out) => {
                            if (!precedingVariables.some((v) => v.value === out.key)) {
                              precedingVariables.push({
                                value: out.key,
                                label: `${out.key} (${prevDesc.name})`,
                              });
                            }
                          });
                        }

                        // 2. Add custom outputs (outputKey parameter) if specified
                        const outputKey = prevStep.params?.outputKey as string;
                        if (outputKey && outputKey.trim() !== '') {
                          if (!precedingVariables.some((v) => v.value === outputKey)) {
                            const stepName = prevStep.stepId
                              .replace('-indicator', '')
                              .replace('-calculator', '')
                              .toUpperCase();
                            precedingVariables.push({
                              value: outputKey,
                              label: `${outputKey} (${stepName})`,
                            });
                          }
                        }
                      }

                      return (
                        <React.Fragment key={step.instanceId}>
                          <PipelineStepCard
                            instanceId={step.instanceId}
                            descriptor={descriptor}
                            params={step.params}
                            runIf={step.runIf}
                            onRemove={() => onRemoveStep(step.instanceId)}
                            onUpdateParams={(p) => onUpdateStepParams(step.instanceId, p)}
                            onUpdateRunIf={(cond) => onUpdateStepRunIf(step.instanceId, cond)}
                            variables={precedingVariables}
                            tokenXSym={tokenXSym}
                            tokenYSym={tokenYSym}
                          />

                          {/* Inline Quick Add Divider between cards */}
                          <div className="relative h-6 flex items-center justify-center group z-10">
                            <div className="absolute inset-x-0 h-0.5 border-t-2 border-dashed border-[#0D0D0D]/20 group-hover:border-[#FF4500] transition-colors" />
                            <button
                              onClick={() => setQuickAddMenuIndex(idx + 1)}
                              className="relative z-10 w-6 h-6 rounded-full bg-white border-2 border-[#0D0D0D] flex items-center justify-center text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white transition-all shadow-[1px_1px_0_#0D0D0D] group-hover:scale-110"
                              title={`Insert step after index ${idx + 1}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {quickAddMenuIndex === idx + 1 && (
                              <div className="absolute top-8 bg-white border-2 border-[#0D0D0D] shadow-[4px_4px_0_#0D0D0D] p-2 z-30 flex flex-col gap-1 w-52 max-h-60 overflow-y-auto">
                                <div className="text-[9px] font-bold text-gray-500 uppercase pb-1 border-b border-gray-200">
                                  Select Step to Insert:
                                </div>
                                {availableDescriptors.map((d) => (
                                  <button
                                    key={d.id}
                                    onClick={() => handleQuickAdd(d.id, idx + 1)}
                                    className="text-left px-2 py-1 text-[10px] font-bold text-[#0D0D0D] hover:bg-[#FF4500] hover:text-white uppercase"
                                  >
                                    {d.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
