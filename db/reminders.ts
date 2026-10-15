import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { queryClient } from '@/api/queryClient';
import { buildReminders } from '@/utils/reminders';
import { getProfile } from './profile';
import { queryKeys } from './queryKeys';
import { getRecurrences } from './recurrences';

const CHANNEL_ID = 'due-dates';
const CHANNEL_NAME = 'Vencimentos';

// A reminder that goes off while the app is open still shows, as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Asks for the permission to notify, once; false when it was denied (and cannot be asked again).
export async function ensureReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Takes every reminder away. They carry the names of expenses, so they must not outlive the session.
export async function clearReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled to take away.
  }
}

// Schedules again, from scratch, the reminders of what is about to fall due: the morning before.
// The app only schedules these, so clearing them all first keeps the list exactly what the recurring
// expenses ask for right now. Safe to call whenever something changes, and never throws: a reminder
// that fails to schedule must not break the screen that asked for it.
export async function refreshReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Through the cache: what a screen just read is not asked for again, and what was just changed is.
    const profile = await queryClient.fetchQuery({ queryKey: queryKeys.profile, queryFn: getProfile });
    if (!profile.remindersEnabled) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const recurrences = await queryClient.fetchQuery({ queryKey: queryKeys.recurrences, queryFn: getRecurrences });
    const reminders = buildReminders(recurrences, new Date());
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.key,
        content: { title: reminder.title, body: reminder.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.fireAt,
          channelId: CHANNEL_ID,
        },
      });
    }
  } catch {
    // Reminders are a convenience.
  }
}
