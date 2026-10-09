import { formatMoney } from './format';

export interface Reminder {
  /** Stable, so the same occurrence is never scheduled twice. */
  key: string;
  /** When the notification goes off, in the device's own time. */
  fireAt: Date;
  title: string;
  body: string;
}

// The reminder goes off the day before, at this hour.
export const REMINDER_HOUR = 9;
// Only what falls due in this many days is scheduled; it is scheduled again every time the app opens.
export const REMINDER_WINDOW_DAYS = 45;
// iOS keeps at most 64 scheduled notifications.
export const MAX_REMINDERS = 50;

export const REMINDER_TITLE = (name: string) => `${name} vence amanhã`;
export const REMINDER_BODY = (amount: number, installment: number | null, total: number | null) =>
  total !== null && installment !== null
    ? `Parcela ${installment}/${total} · ${formatMoney(amount)}`
    : formatMoney(amount);
