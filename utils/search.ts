import { type TransactionRecord } from '@/db/transactions';

export type TypeFilter = 'all' | 'income' | 'expense';

export interface SearchFilters {
  text: string;
  type: TypeFilter;
  /** null: any category. */
  categoryId: string | null;
}

// Lower case with the accents taken off, so "alimentacao" finds "Alimentação".
export function foldText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// What is left of the transactions after the filters, in the order they came. Every word typed has to
// be found in the name, the description, the category or the account.
export function searchTransactions(list: TransactionRecord[], filters: SearchFilters): TransactionRecord[] {
  const words = foldText(filters.text).split(/\s+/).filter(Boolean);

  return list.filter((t) => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.categoryId !== null && t.categoryId !== filters.categoryId) return false;
    if (words.length === 0) return true;
    const haystack = foldText(`${t.name} ${t.description ?? ''} ${t.categoryName} ${t.cardName}`);
    return words.every((word) => haystack.includes(word));
  });
}

// What the found transactions add up to: income minus expenses.
export function netOf(list: TransactionRecord[]): number {
  return list.reduce((sum, t) => sum + t.amount, 0);
}
