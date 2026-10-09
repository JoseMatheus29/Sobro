import { budgetForMonth } from './budget';
import { SUMMARY_MONTHS, type HistoryEntry, type HistoryInput } from './history-type';

// One entry per month that has transactions, plus the current one, newest first.
export function buildHistory({ totals, budgets, currentMonth }: HistoryInput): HistoryEntry[] {
  const byMonth = new Map(totals.map((t) => [t.month, t]));
  if (!byMonth.has(currentMonth)) byMonth.set(currentMonth, { month: currentMonth, income: 0, expense: 0 });

  return [...byMonth.values()]
    .sort((a, b) => (a.month < b.month ? 1 : a.month > b.month ? -1 : 0))
    .map(({ month, income, expense }) => {
      const budget = budgetForMonth(budgets, month);
      return {
        month,
        income,
        expense,
        net: income - expense,
        budget,
        budgetUse: budget !== null && budget > 0 ? expense / budget : null,
        current: month === currentMonth,
      };
    });
}

// In how many of the latest months there was money left, out of how many months were looked at.
export function countKeptMonths(entries: HistoryEntry[], limit = SUMMARY_MONTHS): { kept: number; total: number } {
  const recent = entries.slice(0, limit);
  return { kept: recent.filter((e) => e.net >= 0).length, total: recent.length };
}
