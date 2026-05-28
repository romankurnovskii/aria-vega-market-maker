/**
 * @file PipelineStepCard.tsx
 * @description Renders a single step card in the strategy pipeline editor canvas, supporting parameter configuration inputs.
 *
 * @features
 * - Sortable and draggable list item using @dnd-kit/sortable
 * - Renders required inputs and provided outputs for visual context dependency tracking
 * - Dynamically renders parameter controls based on StepDescriptor parameters types (number, string, boolean, select, textarea)
 *
 * @dependencies @dnd-kit/sortable, lucide-react, @lp-system/core
 * @sideEffects Triggers parameter update callback props on user input changes
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StepDescriptor } from '@lp-system/core';
import { GripVertical, X } from 'lucide-react';
import React from 'react';
import { ConditionBuilder } from './ConditionBuilder';

interface Props {
  instanceId: string;
  descriptor: StepDescriptor;
  params: Record<string, unknown>;
  onRemove: () => void;
  onUpdateParams: (params: Record<string, unknown>) => void;
}

export function PipelineStepCard({ instanceId, descriptor, params, onRemove, onUpdateParams }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const handleParamChange = (key: string, value: string | number | boolean) => {
    onUpdateParams({ [key]: value });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border border-[#0D0D0D] ${
        isDragging ? 'shadow-[8px_8px_0_#0D0D0D] opacity-90 -translate-y-1 -translate-x-1' : 'shadow-[4px_4px_0_#0D0D0D]'
      } flex flex-col w-full max-w-2xl mx-auto transition-all`}
    >
      {/* Header */}
      <div className="bg-[#F4F4F0] border-b border-[#0D0D0D] p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-[#0D0D0D] hover:text-[#F4F4F0] p-1.5 text-[#0D0D0D] border border-transparent hover:border-[#0D0D0D] transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0D0D0D] font-syne uppercase">{descriptor.name}</h3>
            <div className="text-[10px] text-[#0D0D0D]/60 uppercase tracking-wider font-mono-jb">{descriptor.category}</div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-[#0D0D0D] hover:text-white p-1.5 hover:bg-[#FF4500] border border-transparent hover:border-[#0D0D0D] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex gap-6">
        {/* Left: Ports (Inputs/Outputs) */}
        <div className="flex-1 space-y-4 font-mono-jb">
          {descriptor.inputs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#0D0D0D] mb-1.5 uppercase border-b border-[#0D0D0D] pb-1">
                Requires Context
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {descriptor.inputs.map((input) => (
                  <span
                    key={input.key}
                    title={input.description}
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-[#0D0D0D] text-white"
                  >
                    {input.key} {input.required ? '*' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {descriptor.outputs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#0D0D0D] mb-1.5 uppercase border-b border-[#0D0D0D] pb-1">
                Provides Context
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {descriptor.outputs.map((output) => (
                  <span
                    key={output.key}
                    title={output.description}
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-white text-[#0D0D0D] border border-[#0D0D0D]"
                  >
                    {output.key}
                  </span>
                ))}
              </div>
            </div>
          )}
          {descriptor.inputs.length === 0 && descriptor.outputs.length === 0 && (
            <div className="text-[11px] text-[#0D0D0D]/50 italic">No context dependencies</div>
          )}
        </div>

        {/* Right: Params Form */}
        {descriptor.params.length > 0 && (
          <div className="flex-1 bg-[#F4F4F0] p-4 border border-[#0D0D0D] shadow-[2px_2px_0_#0D0D0D] font-mono-jb">
            <div className="text-[11px] font-bold text-[#0D0D0D] mb-3 uppercase border-b border-[#0D0D0D] pb-1">
              Configuration
            </div>
            <div className="space-y-4">
              {descriptor.params.map((p) => {
                const value = params[p.key] ?? p.default ?? '';
                return (
                  <div key={p.key} className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-[#0D0D0D] font-bold">{p.key}</label>
                    {p.type === 'number' ? (
                      <input
                        type="number"
                        value={value as number}
                        onChange={(e) => handleParamChange(p.key, parseFloat(e.target.value))}
                        className="bg-white border border-[#0D0D0D] px-2 py-1.5 text-[13px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500]"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'string' ? (
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="bg-white border border-[#0D0D0D] px-2 py-1.5 text-[13px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500]"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value as boolean}
                        onChange={(e) => handleParamChange(p.key, e.target.checked)}
                        className="w-4 h-4 border-[#0D0D0D] accent-[#FF4500]"
                      />
                    ) : p.type === 'select' ? (
                      <select
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="bg-white border border-[#0D0D0D] px-2 py-1.5 text-[13px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] appearance-none"
                      >
                        {(p.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : p.type === 'textarea' ? (
                      <textarea
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        rows={4}
                        className="bg-white border border-[#0D0D0D] px-2 py-1.5 text-[12px] text-[#0D0D0D] font-mono focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] resize-y"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'condition-builder' ? (
                      <ConditionBuilder
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={value as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(val) => handleParamChange(p.key, val as any)}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="bg-white border border-[#0D0D0D] px-2 py-1.5 text-[13px] text-[#0D0D0D] focus:outline-none focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500]"
                      />
                    )}
                    <div className="text-[9px] text-[#0D0D0D]/60 mt-1">{p.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
