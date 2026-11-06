import { type CardRecord } from '@/db/cards';
import { type TransactionRecord } from '@/db/transactions';
import { buildInvoice, dueOn, invoiceName, openInvoiceMonth, plannedPurchases, todayKey } from './invoice';
import { INVOICE_EPSILON } from './invoice-type';
import { addMonths, monthKey } from './month';
import { nextOccurrence, occurrenceIn } from './recurrence';
import { type RecurrenceRecord } from './recurrence-type';
import {
  INVOICE_REMINDER_BODY,
  INVOICE_REMINDER_TITLE,
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

// What an account's credit card has been used for, to work its invoices out (see db/invoices.ts `getCreditHistory`).
export interface CreditHistory {
  purchases: TransactionRecord[];
  payments: TransactionRecord[];
}

// The reminders for the invoices of the credit cards that fall due soon and still have something to pay: the morning
// before the due day, at the same hour as the others. The invoice is worked out the way the invoice screen does it (what
// was bought in its cycle, plus what the recurring expenses on credit will put in it, less what was paid), so a paid one
// has none. `histories` is by account id; an account without credit, or without its history, has none.
export function buildInvoiceReminders(
  cards: CardRecord[],
  histories: Record<number, CreditHistory>,
  recurrences: RecurrenceRecord[],
  now: Date
): Reminder[] {
  const horizon = now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const today = todayKey(now);
  const reminders: Reminder[] = [];

  for (const card of cards) {
    const rules = card.credit;
    const history = histories[card.id];
    if (!rules || !history) continue;

    // The invoice waiting to be paid, the one taking purchases and the next one: the ones that can fall due soon.
    const open = openInvoiceMonth(today, rules);
    for (const month of [addMonths(open, -1), open, addMonths(open, 1)]) {
      // The due day as a calendar day, minus one day, at 9h on the phone.
      const [year, m, day] = dueOn(month, rules).split('-').map(Number);
      const fireAt = new Date(year, m - 1, day - 1, REMINDER_HOUR, 0, 0);
      if (fireAt.getTime() <= now.getTime() || fireAt.getTime() > horizon) continue;

      const invoice = buildInvoice({
        month,
        rules,
        purchases: history.purchases,
        payments: history.payments,
        planned: plannedPurchases(recurrences, month, rules, card.id),
        today,
      });
      const toPay = invoice.total - invoice.paid;
      if (toPay <= INVOICE_EPSILON) continue;

      reminders.push({
        key: `invoice-${card.id}-${month}`,
        fireAt,
        title: INVOICE_REMINDER_TITLE(card.name),
        body: INVOICE_REMINDER_BODY(invoiceName(month, rules), toPay),
      });
    }
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
