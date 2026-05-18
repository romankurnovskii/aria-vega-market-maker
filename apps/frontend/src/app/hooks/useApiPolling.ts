import { useEffect } from 'react';

export const useApiPolling = (fetchFn: () => Promise<void>, intervalMs: number): void => {
  useEffect(() => {
    fetchFn();
    const id = setInterval(fetchFn, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
