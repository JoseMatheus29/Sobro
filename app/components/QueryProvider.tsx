import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { focusManager, QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/app/components/auth/AuthProvider';

// The cache of the API's data, above the screens. It follows the app coming back to the foreground (what is
// old is read again) and is emptied whenever there is no session, so the next account never sees what the
// last one had on screen.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (status === 'signedOut') queryClient.clear();
  }, [status]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Everything under app/ is a route for Expo Router, which warns about a file with no default export.
export default QueryProvider;
