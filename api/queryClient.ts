import { QueryClient } from '@tanstack/react-query';

import { QUERY_GC_MS, QUERY_STALE_MS } from '@/types/api/api-type';
import { isNetworkError } from './errors';

// The cache of what the API sent. It lives in memory only: nothing financial is written to the phone's disk.
// A screen opens at once with what it last showed and refreshes in the background once the data is older than
// `QUERY_STALE_MS`, or as soon as something changed (see `notifyDataChanged`).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_MS,
      gcTime: QUERY_GC_MS,
      // Only a missing signal is worth trying again, once: a rule of the server answers the same next time.
      retry: (failureCount, error) => isNetworkError(error) && failureCount < 1,
      refetchOnReconnect: false,
    },
    mutations: { retry: false },
  },
});
