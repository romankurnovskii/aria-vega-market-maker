/**
 * @file PipelineStepCard.tsx
 * @description Renders a single step card in the strategy pipeline editor canvas, styled with a Brutalist aesthetic and visual port handles.
 *
 * @features
 * - Sortable and draggable list item using @dnd-kit/sortable
 * - Exposes explicit visual circular port handles on card edges representing context inputs and outputs
 * - Features dynamic terminal action/data category tags (e.g. DATA, GATE, TERMINAL)
 * - Dynamically renders parameter controls based on StepDescriptor parameters types
 *
 * @dependencies @dnd-kit/sortable, lucide-react, @lp-system/core
 * @sideEffects Triggers parameter update callback props on user input changes
 */
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StepDescriptor } from '@lp-system/core';
import { GripVertical, X, Activity, AlertTriangle, Cpu } from 'lucide-react';
import React from 'react';
import { ConditionBuilder } from './ConditionBuilder';

interface Props {
  instanceId: string;
  descriptor: StepDescriptor;
  params: Record<string, unknown>;
  onRemove: () => void;
  onUpdateParams: (params: Record<string, unknown>) => void;
  variables?: { value: string; label: string }[];
  tokenXSym?: string;
  tokenYSym?: string;
}

export function PipelineStepCard({
  instanceId,
  descriptor,
  params,
  onRemove,
  onUpdateParams,
  variables,
  tokenXSym,
  tokenYSym,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: instanceId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const handleParamChange = (key: string, value: string | number | boolean) => {
    onUpdateParams({ [key]: value });
  };

  // Determine dynamic node tag and color
  const getNodeTag = (): { text: string; bg: string; textCol: string; icon: React.ReactNode } => {
    switch (descriptor.category) {
      case 'indicator':
        return {
          text: 'DATA INDICATOR',
          bg: 'bg-[#F4F4F0]',
          textCol: 'text-[#0D0D0D]',
          icon: <Activity className="w-3.5 h-3.5" />,
        };
      case 'guard':
      case 'analysis':
        return {
          text: 'SECURITY GATE',
          bg: 'bg-white border-2 border-[#0D0D0D]',
          textCol: 'text-[#0D0D0D]',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case 'decision':
        return {
          text: 'TERMINAL DECISION',
          bg: 'bg-[#FF4500]',
          textCol: 'text-white',
          icon: <Cpu className="w-3.5 h-3.5" />,
        };
      default:
        return {
          text: descriptor.category.toUpperCase(),
          bg: 'bg-white',
          textCol: 'text-[#0D0D0D]',
          icon: <Cpu className="w-3.5 h-3.5" />,
        };
    }
  };

  const tag = getNodeTag();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-[#0D0D0D] relative ${
        isDragging
          ? 'shadow-[8px_8px_0_#0D0D0D] opacity-90 -translate-y-1 -translate-x-1'
          : 'shadow-[4px_4px_0_#0D0D0D] hover:shadow-[6px_6px_0_#0D0D0D] hover:-translate-x-0.5 hover:-translate-y-0.5'
      } flex flex-col w-full max-w-2xl mx-auto transition-all font-mono-jb`}
    >
      {/* Node Visual Port Handles (App Aesthetic Only) */}
      <div
        className="absolute left-[-9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0D0D0D] border-2 border-white flex items-center justify-center z-20 group"
        title="Input Port"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white group-hover:bg-[#FF4500]" />
      </div>
      <div
        className="absolute right-[-9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#0D0D0D] border-2 border-white flex items-center justify-center z-20 group"
        title="Output Port"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#FF4500] group-hover:bg-white" />
      </div>

      {/* Header */}
      <div className="bg-[#F4F4F0] border-b-2 border-[#0D0D0D] p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-[#0D0D0D] hover:text-white p-1.5 text-[#0D0D0D] border border-transparent hover:border-[#0D0D0D] transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0D0D0D] font-syne uppercase tracking-tight">{descriptor.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold ${tag.bg} ${tag.textCol} px-1.5 py-0.5 uppercase border border-[#0D0D0D]`}
              >
                {tag.icon}
                {tag.text}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="text-[#0D0D0D] hover:text-white p-1.5 hover:bg-[#FF4500] border-2 border-[#0D0D0D] bg-white transition-colors shadow-[2px_2px_0_#0D0D0D] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col md:flex-row gap-6">
        {/* Left: Description & Ports (Inputs/Outputs) */}
        <div className="flex-1 space-y-4 font-mono-jb">
          <div className="text-xs text-[#0D0D0D]/70 leading-relaxed italic border-l-2 border-[#FF4500] pl-2">
            {descriptor.description}
          </div>

          {descriptor.inputs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#0D0D0D] mb-1.5 uppercase border-b border-[#0D0D0D]/10 pb-1">
                Required Context Fields
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {descriptor.inputs.map((input) => (
                  <span
                    key={input.key}
                    title={input.description}
                    className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold bg-[#0D0D0D] text-white uppercase border border-[#0D0D0D]"
                  >
                    {input.key}
                    {input.required ? '*' : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {descriptor.outputs.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-[#0D0D0D] mb-1.5 uppercase border-b border-[#0D0D0D]/10 pb-1">
                Emitted Context Fields
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {descriptor.outputs.map((output) => (
                  <span
                    key={output.key}
                    title={output.description}
                    className="inline-flex items-center px-2 py-0.5 text-[9px] font-bold bg-[#F4F4F0] text-[#0D0D0D] border border-[#0D0D0D]"
                  >
                    {output.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Params Form */}
        {descriptor.params.length > 0 && (
          <div className="flex-1 bg-[#F4F4F0] p-4 border-2 border-[#0D0D0D] shadow-[3px_3px_0_#0D0D0D] font-mono-jb">
            <div className="text-[11px] font-bold text-[#0D0D0D] mb-3 uppercase border-b-2 border-[#0D0D0D] pb-1">
              Block Configuration
            </div>
            <div className="space-y-4">
              {descriptor.params.map((p) => {
                const value = params[p.key] ?? p.default ?? '';
                return (
                  <div key={p.key} className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-[#0D0D0D] font-bold uppercase">
                      {p.key === 'tokenXAmount'
                        ? `${tokenXSym || 'Base'} Amount`
                        : p.key === 'tokenYAmount'
                          ? `${tokenYSym || 'Quote'} Amount`
                          : p.key}
                    </label>
                    {p.type === 'number' ? (
                      <input
                        type="number"
                        value={value as number}
                        onChange={(e) => handleParamChange(p.key, parseFloat(e.target.value))}
                        className="bg-white border-2 border-[#0D0D0D] px-2 py-1.5 text-xs text-[#0D0D0D] font-bold focus:outline-none focus:bg-white"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'string' ? (
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="bg-white border-2 border-[#0D0D0D] px-2 py-1.5 text-xs text-[#0D0D0D] font-bold focus:outline-none focus:bg-white"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'boolean' ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) => handleParamChange(p.key, e.target.checked)}
                          className="w-4 h-4 border-2 border-[#0D0D0D] accent-[#FF4500] bg-white cursor-pointer"
                        />
                        <span className="text-[11px] text-[#0D0D0D]/60 uppercase">Enabled</span>
                      </div>
                    ) : p.type === 'select' ? (
                      <div className="relative">
                        <select
                          value={value as string}
                          onChange={(e) => handleParamChange(p.key, e.target.value)}
                          className="w-full bg-white border-2 border-[#0D0D0D] px-2 py-1.5 text-xs text-[#0D0D0D] font-bold focus:outline-none cursor-pointer appearance-none uppercase"
                        >
                          {(p.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#0D0D0D]">
                          ▼
                        </div>
                      </div>
                    ) : p.type === 'textarea' ? (
                      <textarea
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        rows={4}
                        className="bg-white border-2 border-[#0D0D0D] px-2 py-1.5 text-xs text-[#0D0D0D] font-bold focus:outline-none resize-y"
                        placeholder={String(p.default ?? '')}
                      />
                    ) : p.type === 'condition-builder' ? (
                      <ConditionBuilder
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={value as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(val) => handleParamChange(p.key, val as any)}
                        variables={variables}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value as string}
                        onChange={(e) => handleParamChange(p.key, e.target.value)}
                        className="bg-white border-2 border-[#0D0D0D] px-2 py-1.5 text-xs text-[#0D0D0D] font-bold focus:outline-none"
                      />
                    )}
                    <div className="text-[9px] text-[#0D0D0D]/50 uppercase tracking-tight leading-tight">
                      {p.description}
                    </div>
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
