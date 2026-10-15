import { api } from '@/api/client';
import { type ApiMonthlyBudget } from '@/api/types';
import { type BudgetEntry } from '@/utils/budget';

// Every month a budget was set from, oldest first. The first version's budget comes as month '0000-00',
// which applies to every month before the next entry.
export function getBudgetEntries(): Promise<BudgetEntry[]> {
  return api<ApiMonthlyBudget[]>('GET', '/v1/budgets/monthly');
}

// The budget applies from `month` on, until the next change. A null amount removes it from then on.
export async function setBudgetFrom(month: string, amount: number | null): Promise<void> {
  await api('PUT', `/v1/budgets/monthly/${month}`, { body: { amount } });
}
