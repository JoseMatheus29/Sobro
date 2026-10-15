import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import * as authApi from '@/api/auth';
import { hasSession, setOnSessionExpired, setOnUpgradeRequired } from '@/api/session';
import { clearReminders } from '@/db/reminders';
import {
  AUTH_HOOK_ERROR,
  SESSION_EXPIRED_TOAST,
  type AuthContextValue,
  type AuthStatus,
  type SignUpInput,
} from '@/types/components/auth/auth-type';

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error(AUTH_HOOK_ERROR);
  return value;
}

// Knows whether there is a session. It lives above the Stack and below the FeedbackProvider: the tokens are
// read from the secure store when the app opens, and the API client reports back when a session ends on its
// own (the refresh token was refused) or when the server wants a newer app.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useFeedback();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  // What the API client's callback sees when a session ends: the status as it is now, not as it was when it was set.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    hasSession().then((found) => {
      if (!cancelled) setStatus(found ? 'signedIn' : 'signedOut');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setOnSessionExpired(() => {
      // Only the first of several calls that fail together, and only a session that was open.
      if (statusRef.current !== 'signedIn') return;
      clearReminders();
      setStatus('signedOut');
      showToast(SESSION_EXPIRED_TOAST);
    });
    setOnUpgradeRequired(() => setUpgradeRequired(true));
    return () => {
      setOnSessionExpired(() => {});
      setOnUpgradeRequired(() => {});
    };
  }, [showToast]);

  const signIn = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password);
    setStatus('signedIn');
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    await authApi.register(input);
    setStatus('signedIn');
  }, []);

  // The reminders carry the names of the expenses, so they leave with the session.
  const signOut = useCallback(async () => {
    await authApi.logout();
    await clearReminders();
    setStatus('signedOut');
  }, []);

  const deleteAccount = useCallback(async (password: string) => {
    await authApi.deleteAccount(password);
    await clearReminders();
    setStatus('signedOut');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, upgradeRequired, signIn, signUp, signOut, deleteAccount }),
    [status, upgradeRequired, signIn, signUp, signOut, deleteAccount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Everything under app/ is a route for Expo Router, which warns about a file with no default export.
export default AuthProvider;
