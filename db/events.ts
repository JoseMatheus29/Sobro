import { useEffect, useRef, useSyncExternalStore } from 'react';

// A counter bumped when data changes outside what a screen did itself (the recurring expenses that
// fell due while the app was in the background). The data hooks listen to it and refetch.
let version = 0;
const listeners = new Set<() => void>();

export function notifyDataChanged() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function useDataVersion(): number {
  return useSyncExternalStore(subscribe, () => version);
}

// Runs `refetch` again whenever `notifyDataChanged` is called (not on the first render).
export function useRefetchOnDataChange(refetch: () => void) {
  const current = useDataVersion();
  const seen = useRef(current);
  const latest = useRef(refetch);
  latest.current = refetch;

  useEffect(() => {
    if (current === seen.current) return;
    seen.current = current;
    latest.current();
  }, [current]);
}
