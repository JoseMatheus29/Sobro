import { type TransactionRecord } from '@/db/transactions';

// The day of its month on which the money of a transaction leaves, for comparing a month with the one before it "up to
// the same day": the due day of the invoice for a purchase on credit (the hooks that read a month's spending set
// `spendingDay`), the day itself for anything else, or for a row that came without it.
export function spendingDayInMonth(t: Pick<TransactionRecord, 'spendingDay' | 'occurredAt'>): number {
  return t.spendingDay ?? new Date(t.occurredAt).getUTCDate();
}
