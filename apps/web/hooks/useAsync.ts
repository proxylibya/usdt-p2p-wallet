/**
 * useAsync Hook - Manages async operations with loading/error states
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncReturn<T> extends AsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for managing async operations
 */
export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }
        return result;
      } catch (error) {
        if (mountedRef.current) {
          setState({ data: null, loading: false, error: error as Error });
        }
        return null;
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) {
      execute();
    }
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { ...state, execute, reset };
}

/**
 * Hook for polling data at intervals
 */
export function usePolling<T>(
  asyncFunction: () => Promise<T>,
  intervalMs: number = 10000,
  enabled: boolean = true
): AsyncState<T> & { refresh: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await asyncFunction();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: error as Error }));
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      fetchData();
      const interval = setInterval(fetchData, intervalMs);
      return () => {
        mountedRef.current = false;
        clearInterval(interval);
      };
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, intervalMs, fetchData]);

  return { ...state, refresh: fetchData };
}

export default useAsync;
