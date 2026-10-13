import { type Palette } from '@/constants/palette';
import { BUDGET_CAUTION_AT, BUDGET_DANGER_AT, type BudgetLevel } from './budget-type';

// The monthly budget is stored as the month it started to apply from, and stays in force until the
// next entry: changing it in October leaves September judged by the budget September had. An entry
// with no amount means "no budget from this month on".
export interface BudgetEntry {
  /** 'YYYY-MM' the amount applies from. */
  month: string;
  amount: number | null;
}

// Entries in any order; the amount in force in `month`, or null when there is none.
export function budgetForMonth(entries: BudgetEntry[], month: string): number | null {
  let inForce: BudgetEntry | null = null;
  for (const entry of entries) {
    if (entry.month <= month && (inForce === null || entry.month > inForce.month)) inForce = entry;
  }
  return inForce?.amount ?? null;
}

// Where a bar sits, from the share of its ceiling already spent. Nothing to measure counts as fine.
export function budgetLevel(use: number | null): BudgetLevel {
  if (use === null) return 'ok';
  if (use >= BUDGET_DANGER_AT) return 'danger';
  if (use >= BUDGET_CAUTION_AT) return 'caution';
  return 'ok';
}

// The color of a spending bar and of the text next to it.
export function budgetColor(use: number | null, colors: Pick<Palette, 'income' | 'warning' | 'expense'>): string {
  const level = budgetLevel(use);
  return level === 'danger' ? colors.expense : level === 'caution' ? colors.warning : colors.income;
}
