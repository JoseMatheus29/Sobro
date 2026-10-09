import {
  CATEGORY_IDS_HIDDEN_FOR,
  type Category,
  type TxType,
} from './registrationSpent-type';

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function categoriesForType(categories: Category[], type: TxType): Category[] {
  const hidden = CATEGORY_IDS_HIDDEN_FOR[type];
  return categories.filter((c) => !hidden.includes(c.id));
}
