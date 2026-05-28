/**
 * @file useStrategyBuilderStore.ts
 * @description Global store managing the state of the drag-and-drop strategy builder.
 *
 * @features
 * - Maintains draft StrategyDefinition (id, name, description, steps)
 * - Actions for adding, removing, reordering, and updating steps
 *
 * @dependencies zustand, @lp-system/core
 */
import { create } from 'zustand';
import { StrategyDefinition, StrategyDefinitionStep } from '@lp-system/core';

export interface StrategyBuilderState {
  // Strategy Metadata
  id: string;
  name: string;
  description: string;

  // The linear pipeline of steps
  // We use a unique 'instanceId' for the UI so the same step can be added multiple times
  steps: (StrategyDefinitionStep & { instanceId: string })[];

  // Actions
  setMetadata: (id: string, name: string, description: string) => void;
  addStep: (stepId: string, defaultParams?: Record<string, unknown>) => void;
  removeStep: (instanceId: string) => void;
  moveStep: (oldIndex: number, newIndex: number) => void;
  updateStepParams: (instanceId: string, params: Record<string, unknown>) => void;

  // Utility
  getStrategyDefinition: () => StrategyDefinition;
  reset: () => void;
}

export const useStrategyBuilderStore = create<StrategyBuilderState>((set, get) => ({
  id: 'custom-strategy-1',
  name: 'Custom Strategy',
  description: 'Built via GUI',
  steps: [],

  setMetadata: (id, name, description) => set({ id, name, description }),

  addStep: (stepId, defaultParams = {}) =>
    set((state) => ({
      steps: [
        ...state.steps,
        { instanceId: `${stepId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, stepId, params: defaultParams },
      ],
    })),

  removeStep: (instanceId) =>
    set((state) => ({
      steps: state.steps.filter((s) => s.instanceId !== instanceId),
    })),

  moveStep: (oldIndex, newIndex) =>
    set((state) => {
      const steps = [...state.steps];
      const [movedItem] = steps.splice(oldIndex, 1);
      steps.splice(newIndex, 0, movedItem);
      return { steps };
    }),

  updateStepParams: (instanceId, params) =>
    set((state) => ({
      steps: state.steps.map((s) => (s.instanceId === instanceId ? { ...s, params: { ...s.params, ...params } } : s)),
    })),

  getStrategyDefinition: () => {
    const { id, name, description, steps } = get();
    return {
      id,
      name,
      description,
      defaultParams: {}, // GUI currently sets params explicitly per step
      steps: steps.map(({ stepId, params }) => ({ stepId, params })),
    };
  },

  reset: () => set({ id: 'custom-strategy-1', name: 'Custom Strategy', description: '', steps: [] }),
}));
