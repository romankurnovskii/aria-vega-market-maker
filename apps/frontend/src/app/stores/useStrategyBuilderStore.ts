/**
 * @file useStrategyBuilderStore.ts
 * @description Global store managing the state of the drag-and-drop strategy builder.
 *
 * @features
 * - Maintains draft StrategyDefinition (id, name, description, steps)
 * - Exposes actions for adding, removing, inserting, reordering, and updating steps
 * - Stores mock/live simulation context data for visual variables tracking
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
  simulationConfig?: {
    poolAddress?: string;
    positionId?: string;
  };

  // The linear pipeline of steps
  // We use a unique 'instanceId' for the UI so the same step can be added multiple times
  steps: (StrategyDefinitionStep & { instanceId: string })[];

  // Actions
  setMetadata: (id: string, name: string, description: string) => void;
  setSimulationConfig: (poolAddress: string, positionId: string) => void;
  addStep: (stepId: string, defaultParams?: Record<string, unknown>) => void;
  insertStep: (stepId: string, index: number, defaultParams?: Record<string, unknown>) => void;
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
  simulationConfig: { poolAddress: '', positionId: '' },
  steps: [
    {
      instanceId: `context-setup-default`,
      stepId: 'context-setup',
      params: {
        poolAddress: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
        tokenXAmount: '0',
        tokenYAmount: '100',
        currentPrice: 100,
        rangeMin: 90,
        rangeMax: 110,
      },
    },
  ],

  setMetadata: (id, name, description) => set({ id, name, description }),
  setSimulationConfig: (poolAddress, positionId) => set({ simulationConfig: { poolAddress, positionId } }),

  addStep: (stepId, defaultParams = {}) =>
    set((state) => ({
      steps: [
        ...state.steps,
        { instanceId: `${stepId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`, stepId, params: defaultParams },
      ],
    })),

  insertStep: (stepId, index, defaultParams = {}) =>
    set((state) => {
      const steps = [...state.steps];
      const newStep = {
        instanceId: `${stepId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        stepId,
        params: defaultParams,
      };
      steps.splice(index, 0, newStep);
      return { steps };
    }),

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
    const { id, name, description, steps, simulationConfig } = get();
    return {
      id,
      name,
      description,
      simulationConfig,
      defaultParams: {}, // GUI currently sets params explicitly per step
      steps: steps.map((s) => ({ stepId: s.stepId, params: s.params })),
    };
  },

  reset: () =>
    set({
      id: 'custom-strategy-1',
      name: 'Custom Strategy',
      description: '',
      steps: [
        {
          instanceId: `context-setup-default`,
          stepId: 'context-setup',
          params: {
            poolAddress: '5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6',
            tokenXAmount: '0',
            tokenYAmount: '100',
            currentPrice: 100,
            rangeMin: 90,
            rangeMax: 110,
          },
        },
      ],
    }),
}));
