import { api } from '@/api/client';
import { type ApiCategoryBudget } from '@/api/types';
import { type CategoryBudgetEntry } from '@/utils/categoryBudget';

export function getCategoryBudgetEntries(): Promise<CategoryBudgetEntry[]> {
  return api<ApiCategoryBudget[]>('GET', '/v1/budgets/categories');
}

// The limit applies from `month` on, until the next change. A null amount removes it from then on.
export async function setCategoryBudgetFrom(categoryId: string, month: string, amount: number | null): Promise<void> {
  await api('PUT', `/v1/budgets/categories/${encodeURIComponent(categoryId)}/${month}`, { body: { amount } });
}
