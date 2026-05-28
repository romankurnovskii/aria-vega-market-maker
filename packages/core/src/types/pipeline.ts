/**
 * @file pipeline.ts
 * @description Type definitions for the agnostic block-based step execution pipeline.
 *
 * @features
 * - StepDescriptor: Machine-readable schema for steps (inputs, outputs, params)
 * - PipelineContext: Universal, open-ended shared context for step execution
 * - StrategyDefinition: JSON-serializable strategy structure
 */
import { Position, OpenParams } from './position';
import { MarketSnapshot } from './market';

/** The universal shared state bag passed through every step. */
export interface PipelineContext {
  /** Well-known fields — always present, typed */
  position: Position;
  market: MarketSnapshot;
  params: Record<string, unknown>;

  /** Step-produced fields — typed by port declarations, open for extension */
  [key: string]: unknown;

  /** Reserved pipeline control fields */
  _signal?: string; // e.g. 'skip', 'close', 'open', 'close+open'
  _reason?: string; // human-readable explanation
  _openParams?: OpenParams; // parameters for the open leg
  _halted?: boolean; // if true, pipeline stops immediately
}

export type StepCategory =
  | 'guard'
  | 'analysis'
  | 'pricing'
  | 'range'
  | 'amount'
  | 'signal'
  | 'decision'
  | 'indicator'
  | 'custom';

export interface StepPortDescriptor {
  key: string; // context field name, e.g. 'calculations'
  type: string; // human-readable type, e.g. 'CalculatedPrices'
  description: string; // what this port carries
  required?: boolean; // for inputs: must be present or step skips
}

export interface StepParamDescriptor {
  key: string; // param name, e.g. 'rangePercent'
  type: 'number' | 'string' | 'boolean' | 'select' | 'object' | 'textarea' | 'condition-builder';
  description: string;
  default?: unknown;
  options?: string[]; // for 'select' type
  min?: number; // for 'number' type
  max?: number;
}

export interface StepDescriptor {
  id: string; // unique step type ID, e.g. 'initialization-check'
  name: string; // display name
  description: string; // what this step does (for GUI tooltip)
  category: StepCategory;
  inputs: StepPortDescriptor[]; // what this step READS from context
  outputs: StepPortDescriptor[]; // what this step WRITES to context
  params: StepParamDescriptor[]; // configurable parameters
}

export interface StrategyDefinitionStep {
  stepId: string;
  params: Record<string, unknown>;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  steps: StrategyDefinitionStep[];
  defaultParams: Record<string, unknown>;
}

export interface PipelineTraceStep {
  stepId: string;
  durationMs: number;
  inputSnapshot: Record<string, unknown>;
  outputDelta: Record<string, unknown>; // what changed
}

export interface PipelineTrace {
  steps: PipelineTraceStep[];
  finalSignal: string;
  totalDurationMs: number;
}
