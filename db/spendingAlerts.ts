import { budgetForMonth } from '@/utils/budget';
import { limitsForMonth } from '@/utils/categoryBudget';
import { isSpending } from '@/utils/spending';
import { spendingAlerts } from '@/utils/spendingAlerts';
import { type SpendingAlert, type SpendingChange } from '@/utils/spendingAlerts-type';

import { getBudgetEntries } from './budgets';
import { getCategoryBudgetEntries } from './categoryBudgets';
import { getTransactions } from './transactions';

// After an expense is saved: which budget or category limit of the month it counts in went up a step because of it
// (close to the ceiling, or past it). It reads the month again, so it knows the spending as it is now, and works out
// the state before by taking the change back. Never throws: a warning is a courtesy, and a save that worked must not
// look like it failed because this could not be read.
export async function checkSpendingAlerts(change: {
  /** 'YYYY-MM' the expense counts in (its `spendingMonth`). */
  month: string;
  added: SpendingChange | null;
  removed: SpendingChange | null;
}): Promise<SpendingAlert[]> {
  try {
    const { month, added, removed } = change;
    // Nothing was added to the spending, so nothing can have crossed a ceiling.
    if (!added) return [];

    const [budgetEntries, limitEntries, rows] = await Promise.all([
      getBudgetEntries(),
      getCategoryBudgetEntries(),
      getTransactions({ spendingMonth: month }),
    ]);

    const byCategory: Record<string, number> = {};
    let spent = 0;
    for (const t of rows) {
      if (!isSpending(t)) continue;
      const amount = Math.abs(t.amount);
      spent += amount;
      byCategory[t.categoryId] = (byCategory[t.categoryId] ?? 0) + amount;
    }

    return spendingAlerts({
      budget: budgetForMonth(budgetEntries, month),
      limits: limitsForMonth(limitEntries, month),
      spent,
      byCategory,
      added,
      removed,
    });
  } catch {
    return [];
  }
}
