/**
 * @file useApiPolling.ts
 * @description Generic React hook that calls a fetch function immediately and repeats on a fixed interval.
 *              Cleans up the interval on unmount.
 *
 * @features
 * - Calls fetchFn on mount and every intervalMs thereafter
 * - Auto-cleans interval via useEffect return
 *
 * @dependencies React (useEffect)
 */

import { useEffect } from 'react';

export const useApiPolling = (fetchFn: () => Promise<void>, intervalMs: number): void => {
  useEffect(() => {
    fetchFn();
    const id = setInterval(fetchFn, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
