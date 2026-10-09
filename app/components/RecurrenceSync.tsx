import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { notifyDataChanged } from '@/db/events';
import { refreshReminders } from '@/db/reminders';
import { materializeDueRecurrences } from '@/db/recurrences';

// Recurring expenses are turned into transactions when the app starts (see migrateDbIfNeeded) and,
// for an app left open in the background for days, every time it comes back to the foreground. The
// reminders of what is about to fall due are scheduled again at both moments.
export default function RecurrenceSync() {
  const db = useSQLiteContext();

  useEffect(() => {
    refreshReminders(db);

    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      const created = await materializeDueRecurrences(db);
      if (created > 0) notifyDataChanged();
      await refreshReminders(db);
    });
    return () => sub.remove();
  }, [db]);

  return null;
}
