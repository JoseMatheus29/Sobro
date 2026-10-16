import { type TransactionRecord } from '@/db/transactions';
import { budgetForMonth, type BudgetEntry } from './budget';
import {
  FORECAST_HORIZON,
  PLANNED_ID_BASE,
  type FutureMonth,
  type Occurrence,
  type RecurrenceRecord,
} from './recurrence-type';
import { addMonths, monthKey } from './month';

// "2026-10" + day 31 → noon UTC on the 31st, or on the last day of a shorter month.
export function occurrenceDate(month: string, day: number): string {
  const [year, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return new Date(Date.UTC(year, m - 1, Math.min(day, lastDay), 12)).toISOString();
}

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

// The last month the recurrence applies to, or null while it has no end.
export function lastMonthOf(r: RecurrenceRecord): string | null {
  const byPlan = r.total !== null ? addMonths(r.startMonth, r.total - r.firstInstallment) : null;
  if (byPlan !== null && r.endMonth !== null) return byPlan < r.endMonth ? byPlan : r.endMonth;
  return byPlan ?? r.endMonth;
}

// The occurrence of a recurrence in a given month, if there is one after the first (registered by hand).
export function occurrenceIn(r: RecurrenceRecord, month: string): Occurrence | null {
  const k = monthsBetween(r.startMonth, month);
  if (k < 1) return null;
  const last = lastMonthOf(r);
  if (last !== null && month > last) return null;
  return { month, date: occurrenceDate(month, r.day), installment: r.firstInstallment + k };
}

// Occurrences that fell due and were not turned into a transaction yet, oldest first.
export function dueOccurrences(r: RecurrenceRecord, now: Date): Occurrence[] {
  const due: Occurrence[] = [];
  const nowIso = now.toISOString();
  const until = monthKey(now);
  for (let month = addMonths(r.generatedUntil, 1); month <= until; month = addMonths(month, 1)) {
    const occurrence = occurrenceIn(r, month);
    if (!occurrence) break;
    if (occurrence.date > nowIso) break;
    due.push(occurrence);
  }
  return due;
}

// The next occurrence still to come after what was generated, or null when it is over.
export function nextOccurrence(r: RecurrenceRecord): Occurrence | null {
  return occurrenceIn(r, addMonths(r.generatedUntil, 1));
}

// What is planned for a month that has not started, as rows shaped like transactions so the
// screens can show them like any other, marked `planned`. Only within the forecast horizon.
export function plannedTransactions(
  recurrences: RecurrenceRecord[],
  month: string,
  now: Date,
  filters: { cardId?: number } = {}
): TransactionRecord[] {
  const current = monthKey(now);
  if (month <= current || month > addMonths(current, FORECAST_HORIZON)) return [];

  const planned: TransactionRecord[] = [];
  for (const r of recurrences) {
    if (filters.cardId !== undefined && r.cardId !== filters.cardId) continue;
    const occurrence = occurrenceIn(r, month);
    if (!occurrence) continue;
    planned.push({
      id: -(r.id * PLANNED_ID_BASE + occurrence.installment),
      cardId: r.cardId,
      cardName: r.cardName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      categoryColor: r.categoryColor,
      name: r.name,
      description: r.description,
      amount: -r.amount,
      type: 'expense',
      occurredAt: occurrence.date,
      createdAt: occurrence.date,
      planned: true,
      recurrence: { id: r.id, installment: occurrence.installment, total: r.total },
      paymentMethod: r.paymentMethod ?? null,
    });
  }
  // The nearest first: it is a list of what is coming.
  return planned.sort((a, b) => (a.occurredAt < b.occurredAt ? -1 : a.occurredAt > b.occurredAt ? 1 : 0));
}

// The months ahead that have something planned, with what they add up to.
export function futureMonths(
  recurrences: RecurrenceRecord[],
  budgets: BudgetEntry[],
  now: Date
): FutureMonth[] {
  const current = monthKey(now);
  const months: FutureMonth[] = [];
  for (let i = 1; i <= FORECAST_HORIZON; i++) {
    const month = addMonths(current, i);
    const planned = plannedTransactions(recurrences, month, now);
    if (planned.length === 0) continue;
    const total = planned.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const budget = budgetForMonth(budgets, month);
    months.push({
      month,
      total,
      count: planned.length,
      installments: planned.filter((t) => t.recurrence?.total != null).length,
      budget,
      budgetUse: budget !== null && budget > 0 ? total / budget : null,
    });
  }
  return months;
}

// What an installment plan comes to, for the summary shown while registering it.
export function installmentSummary(plan: { total: number; current: number; amount: number; startMonth: string }) {
  const remaining = Math.max(0, plan.total - plan.current + 1);
  return {
    remaining,
    remainingTotal: remaining * plan.amount,
    lastMonth: addMonths(plan.startMonth, plan.total - plan.current),
  };
}

// The short text of the badge: "4/10" for an installment, "Todo mês" for a plain monthly one.
export function recurrenceBadge(recurrence: { installment: number | null; total: number | null }): string {
  return recurrence.total !== null && recurrence.installment !== null
    ? `${recurrence.installment}/${recurrence.total}`
    : 'Todo mês';
}
