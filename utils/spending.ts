import { type CategoryTotal, type TransactionRecord } from '@/db/transactions';
import { isMoneyMove } from './transfer';
import { PAYMENT_KIND_ORDER, type PaymentKind, type PaymentSlice, type PaymentSplit } from './spending-type';

// What counts as spending: an expense that is not only money moving (a transfer between accounts, or the payment of
// an invoice, whose purchases were counted the day they were made). A purchase on credit is spending on its day.
export function isSpending(t: TransactionRecord): boolean {
  return t.type === 'expense' && !isMoneyMove(t);
}

// The month's spending by category, the biggest first. It is the same sum the server makes for the whole account
// (`/reports/category-totals`), done here so it can be looked at for one account only.
export function spendingByCategory(transactions: TransactionRecord[]): CategoryTotal[] {
  const byCategory = new Map<string, CategoryTotal>();
  for (const t of transactions) {
    if (!isSpending(t)) continue;
    const entry = byCategory.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      categoryName: t.categoryName,
      icon: t.categoryIcon,
      color: t.categoryColor,
      bg: `${t.categoryColor}1F`,
      total: 0,
    };
    entry.total += Math.abs(t.amount);
    byCategory.set(t.categoryId, entry);
  }
  return [...byCategory.values()].sort((a, b) => b.total - a.total);
}

const kindOf = (t: TransactionRecord): PaymentKind =>
  t.paymentMethod === 'pix' || t.paymentMethod === 'debit' || t.paymentMethod === 'credit' ? t.paymentMethod : 'other';

// The same spending, split by how it was paid.
export function spendingByPayment(transactions: TransactionRecord[]): PaymentSplit {
  const amounts: Record<PaymentKind, number> = { pix: 0, debit: 0, credit: 0, other: 0 };
  for (const t of transactions) {
    if (isSpending(t)) amounts[kindOf(t)] += Math.abs(t.amount);
  }

  const present = PAYMENT_KIND_ORDER.filter((kind) => amounts[kind] > 0);
  const percents = wholePercents(present.map((kind) => amounts[kind]));
  const slices: PaymentSlice[] = present.map((kind, i) => ({ kind, amount: amounts[kind], percent: percents[i] }));
  return { total: present.reduce((sum, kind) => sum + amounts[kind], 0), slices };
}

// Percents as whole numbers that add up to 100 (the largest remainders get the leftover points).
function wholePercents(amounts: number[]): number[] {
  const total = amounts.reduce((sum, a) => sum + a, 0);
  if (total <= 0) return amounts.map(() => 0);
  const exact = amounts.map((a) => (a / total) * 100);
  const floors = exact.map(Math.floor);
  let left = 100 - floors.reduce((sum, f) => sum + f, 0);
  const byRemainder = exact.map((e, i) => ({ i, rest: e - floors[i] })).sort((a, b) => b.rest - a.rest);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    floors[i] += 1;
    left -= 1;
  }
  return floors;
}
