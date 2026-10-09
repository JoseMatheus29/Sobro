import { type SQLiteDatabase } from 'expo-sqlite';

import { type CategoryBudgetEntry } from '@/utils/categoryBudget';

export async function getCategoryBudgetEntries(db: SQLiteDatabase): Promise<CategoryBudgetEntry[]> {
  const rows = await db.getAllAsync<{ category_id: string; month: string; amount: number | null }>(
    'SELECT category_id, month, amount FROM category_budgets ORDER BY month ASC'
  );
  return rows.map((r) => ({ categoryId: r.category_id, month: r.month, amount: r.amount }));
}

// The limit applies from `month` on, until the next change. A null amount removes it from then on.
export async function setCategoryBudgetFrom(
  db: SQLiteDatabase,
  categoryId: string,
  month: string,
  amount: number | null
): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO category_budgets (category_id, month, amount) VALUES (?, ?, ?)',
    categoryId,
    month,
    amount
  );
}
