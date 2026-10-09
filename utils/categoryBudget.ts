import { budgetForMonth } from './budget';

// A spending limit for one category, kept the way the monthly budget is: the month it starts to
// apply from, in force until the next entry, and a null amount meaning "no limit from then on".
export interface CategoryBudgetEntry {
  categoryId: string;
  /** 'YYYY-MM' the amount applies from. */
  month: string;
  amount: number | null;
}

// The limits in force in a month, by category id; categories with no limit are left out.
export function limitsForMonth(entries: CategoryBudgetEntry[], month: string): Record<string, number> {
  const byCategory = new Map<string, CategoryBudgetEntry[]>();
  for (const entry of entries) {
    const list = byCategory.get(entry.categoryId) ?? [];
    list.push(entry);
    byCategory.set(entry.categoryId, list);
  }

  const limits: Record<string, number> = {};
  for (const [categoryId, list] of byCategory) {
    const amount = budgetForMonth(list, month);
    if (amount !== null && amount > 0) limits[categoryId] = amount;
  }
  return limits;
}
