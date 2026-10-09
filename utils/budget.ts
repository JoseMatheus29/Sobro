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
