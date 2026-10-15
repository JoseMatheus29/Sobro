import { useEffect } from 'react';
import { useRootNavigationState, useRouter, useSegments } from 'expo-router';

import { useAuth } from '@/app/components/auth/AuthProvider';
import { HOME_ROUTE, LOGIN_ROUTE, PUBLIC_ROUTES } from '@/types/components/auth/auth-type';

// Keeps the screen shown in line with the session: with none (it was ended here, or the server refused to
// renew it) every screen but the four of the access flow gives way to the login, and once one opens those
// give way to the dashboard. The first choice, when the app opens, is made by `app/index.tsx`.
export default function SessionGate() {
  const { status } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const navigationReady = useRootNavigationState()?.key !== undefined;
  const first = (segments[0] as string | undefined) ?? '';

  useEffect(() => {
    if (!navigationReady || status === 'loading') return;
    const onPublicRoute = PUBLIC_ROUTES.includes(first);
    const atStart = first === '' || first === 'index';

    const goTo = (route: string) => {
      // Back must not lead into what the session no longer allows (or to the form just filled).
      if (router.canDismiss()) router.dismissAll();
      router.replace(route as any);
    };
    if (status === 'signedOut' && !onPublicRoute && !atStart) goTo(LOGIN_ROUTE);
    if (status === 'signedIn' && onPublicRoute) goTo(HOME_ROUTE);
  }, [navigationReady, status, first, router]);

  return null;
}
