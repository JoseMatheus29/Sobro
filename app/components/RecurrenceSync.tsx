import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/app/components/auth/AuthProvider';
import { refreshReminders } from '@/db/reminders';

// The recurring expenses are turned into transactions by the server whenever it reads, so the app only has to keep
// the reminders of what is about to fall due: scheduled again when it opens, and every time it comes back to the
// foreground (the data a screen shows is read again by the cache, see QueryProvider).
export default function RecurrenceSync() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'signedIn') return;
    refreshReminders();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshReminders();
    });
    return () => sub.remove();
  }, [status]);

  return null;
}
