import { type SQLiteDatabase } from 'expo-sqlite';

import { type BudgetEntry } from '@/utils/budget';

export async function getBudgetEntries(db: SQLiteDatabase): Promise<BudgetEntry[]> {
  return db.getAllAsync<BudgetEntry>('SELECT month, amount FROM monthly_budgets ORDER BY month ASC');
}

// The budget applies from `month` on, until the next change. A null amount removes it from then on.
export async function setBudgetFrom(db: SQLiteDatabase, month: string, amount: number | null): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO monthly_budgets (month, amount) VALUES (?, ?)', month, amount);
}
