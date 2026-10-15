import { api } from '@/api/client';
import { type ApiCategory, type CategoryInput } from '@/api/types';

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  /** True for the ones the person made; false for the catalog everyone has. */
  custom: boolean;
}

// The catalog plus the person's own categories.
export function getCategories(): Promise<CategoryRecord[]> {
  return api<ApiCategory[]>('GET', '/v1/categories');
}

// The id is made by the server. `idempotencyKey` keeps a retry after a lost answer from making two.
export async function createCategory(input: CategoryInput, idempotencyKey?: string): Promise<string> {
  const created = await api<ApiCategory>('POST', '/v1/categories', { body: input, idempotencyKey });
  return created.id;
}

// Only the person's own: the catalog answers 404.
export async function updateCategory(id: string, patch: Partial<CategoryInput>): Promise<void> {
  await api('PATCH', `/v1/categories/${encodeURIComponent(id)}`, { body: patch });
}

// 409 `category_in_use` while there are transactions or recurrences in it: the history is never deleted silently.
export async function deleteCategory(id: string): Promise<void> {
  await api('DELETE', `/v1/categories/${encodeURIComponent(id)}`);
}
