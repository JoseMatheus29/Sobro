import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { type SQLiteDatabase } from 'expo-sqlite';

import { buildReminders } from '@/utils/reminders';
import { getProfile } from './profile';
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

// Schedules again, from scratch, the reminders of what is about to fall due: the morning before.
// The app only schedules these, so clearing them all first keeps the list exactly what the recurring
// expenses ask for right now. Safe to call whenever something changes, and never throws: a reminder
// that fails to schedule must not break the screen that asked for it.
export async function refreshReminders(db: SQLiteDatabase): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const profile = await getProfile(db);
    if (!profile.remindersEnabled) return;
    if (!(await Notifications.getPermissionsAsync()).granted) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: CHANNEL_NAME,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const reminders = buildReminders(await getRecurrences(db), new Date());
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
