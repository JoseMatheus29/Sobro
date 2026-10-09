import { addMonths, monthKey } from './month';
import { nextOccurrence, occurrenceIn } from './recurrence';
import { type RecurrenceRecord } from './recurrence-type';
import {
  MAX_REMINDERS,
  REMINDER_BODY,
  REMINDER_HOUR,
  REMINDER_TITLE,
  REMINDER_WINDOW_DAYS,
  type Reminder,
} from './reminders-type';

// The reminders for what the recurring expenses will have to pay soon, nearest first: one for each
// occurrence that is still to come, going off the morning before it falls due.
export function buildReminders(recurrences: RecurrenceRecord[], now: Date): Reminder[] {
  const horizon = now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const reminders: Reminder[] = [];

  for (const r of recurrences) {
    const first = nextOccurrence(r);
    if (!first) continue;

    for (let month = first.month; month <= addMonths(monthKey(new Date(horizon)), 1); month = addMonths(month, 1)) {
      const occurrence = occurrenceIn(r, month);
      if (!occurrence) break;
      if (new Date(occurrence.date).getTime() > horizon) break;

      // The due day as the person sees it (the date is noon UTC on that day), minus one day, at 9h local.
      const due = new Date(occurrence.date);
      const fireAt = new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate() - 1, REMINDER_HOUR, 0, 0);
      if (fireAt.getTime() <= now.getTime()) continue;

      reminders.push({
        key: `recurrence-${r.id}-${occurrence.month}`,
        fireAt,
        title: REMINDER_TITLE(r.name),
        body: REMINDER_BODY(r.amount, r.total !== null ? occurrence.installment : null, r.total),
      });
    }
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_REMINDERS);
}
