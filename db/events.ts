import { useEffect, useRef, useSyncExternalStore } from 'react';

import { queryClient } from '@/api/queryClient';

// Called after something was saved, edited or deleted (or changed without a screen doing it): every cached
// read is marked old and the ones on screen are read again. Whatever is behind another screen reads when it
// comes back (see db/query.ts).
//
// The counter and the listeners below are for the hooks that still read the old local database; they go
// away with it.
let version = 0;
const listeners = new Set<() => void>();

export function notifyDataChanged() {
  version += 1;
  listeners.forEach((listener) => listener());
  void queryClient.invalidateQueries();
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
