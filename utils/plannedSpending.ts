import { type TransactionRecord } from '@/db/transactions';
import { type BudgetEntry, budgetForMonth } from './budget';
import { dayOf, spendingDayOf, spendingMonthOf } from './invoice';
import { type InvoiceRules } from './invoice-type';
import { addMonths, currentMonthKey } from './month';
import { occurrenceIn, plannedRow } from './recurrence';
import { FORECAST_HORIZON, type FutureMonth, type RecurrenceRecord } from './recurrence-type';

// What the recurring expenses plan for a month by the month each one COUNTS in (see `spendingMonthOf`): an installment
// bought on credit counts in the month its invoice is due in, which is up to two months after its own day (the
// invoice closes after it, then falls due after the closing). A month that has not started only: what is planned
// for a month that began is already a transaction (the server makes them as they fall due, and the ones still to
// come this month are not shown). `rulesOf` gives the card days of an account, null when it has no credit card.
export function plannedBySpendingMonth(
  recurrences: RecurrenceRecord[],
  month: string,
  now: Date,
  rulesOf: (cardId: number) => InvoiceRules | null,
  filters: { cardId?: number } = {}
): TransactionRecord[] {
  const current = currentMonthKey(now);
  if (month <= current || month > addMonths(current, FORECAST_HORIZON)) return [];

  const nowIso = now.toISOString();
  const planned: TransactionRecord[] = [];
  for (const r of recurrences) {
    if (filters.cardId !== undefined && r.cardId !== filters.cardId) continue;
    const rules = r.paymentMethod === 'credit' ? rulesOf(r.cardId) : null;
    for (const monthOfDay of [month, addMonths(month, -1), addMonths(month, -2)]) {
      const occurrence = occurrenceIn(r, monthOfDay);
      // What fell due already is a transaction: the server made it when it read.
      if (!occurrence || occurrence.date <= nowIso) continue;
      const day = dayOf(occurrence.date);
      if (spendingMonthOf(day, r.paymentMethod, rules) !== month) continue;
      planned.push({
        ...plannedRow(r, occurrence),
        spendingMonth: month,
        spendingDay: spendingDayOf(day, r.paymentMethod, rules),
      });
    }
  }
  // The nearest first: it is a list of what is coming.
  return planned.sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0));
}

// The months ahead with something committed in them, for the history: what was already registered in them (the
// purchases on credit whose invoice falls due then, `registered` by month) plus what is planned.
export function futureSpendingMonths(
  recurrences: RecurrenceRecord[],
  budgets: BudgetEntry[],
  registered: ReadonlyMap<string, number>,
  now: Date,
  rulesOf: (cardId: number) => InvoiceRules | null
): FutureMonth[] {
  const current = currentMonthKey(now);
  const months: FutureMonth[] = [];
  for (let i = 1; i <= FORECAST_HORIZON; i++) {
    const month = addMonths(current, i);
    const planned = plannedBySpendingMonth(recurrences, month, now, rulesOf);
    const registeredTotal = registered.get(month) ?? 0;
    if (planned.length === 0 && registeredTotal === 0) continue;
    const total = registeredTotal + planned.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const budget = budgetForMonth(budgets, month);
    months.push({
      month,
      total,
      registered: registeredTotal,
      count: planned.length,
      installments: planned.filter((t) => t.recurrence?.total != null).length,
      budget,
      budgetUse: budget !== null && budget > 0 ? total / budget : null,
    });
  }
  return months;
}
