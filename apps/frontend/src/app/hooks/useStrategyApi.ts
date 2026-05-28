/**
 * @file useStrategyApi.ts
 * @description Hook to interact with the engine's Strategy Builder APIs.
 *
 * @features
 * - fetchSteps: GET /steps to retrieve all available StepDescriptors
 * - saveStrategy: POST /strategies to save a configured StrategyDefinition
 *
 * @dependencies @lp-system/core types
 */
import { StepDescriptor, StrategyDefinition } from '@lp-system/core';
import { useCallback, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8441';

export function useStrategyApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSteps = useCallback(async (): Promise<StepDescriptor[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/steps`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.availableSteps || [];
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useStrategyApi] Failed to fetch steps:', msg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveStrategy = useCallback(async (definition: StrategyDefinition): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      console.error('[useStrategyApi] Failed to save strategy:', msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetchSteps, saveStrategy, isLoading, error };
}
