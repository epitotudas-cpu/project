import { useCallback, useEffect, useRef } from 'react';

/**
 * Tracks scheduled timeouts and automatically clears all pending timers on unmount.
 */
export function useSafeTimeouts() {
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delayMs: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter((item) => item !== id);
      callback();
    }, delayMs);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  return scheduleTimeout;
}

