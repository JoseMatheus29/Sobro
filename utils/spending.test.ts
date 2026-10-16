import { type TransactionRecord } from '@/db/transactions';
import { isSpending, spendingByCategory, spendingByPayment } from './spending';

let id = 1;

function tx(overrides: Partial<TransactionRecord> & { amount: number }): TransactionRecord {
  return {
    id: id++,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'food',
    categoryName: 'Alimentação',
    categoryIcon: 'restaurant',
    categoryColor: '#E67E22',
    name: 'Item',
    description: null,
    type: overrides.amount >= 0 ? 'income' : 'expense',
    occurredAt: '2026-10-05T12:00:00.000Z',
    createdAt: '2026-10-05T12:00:00.000Z',
    ...overrides,
  };
}

describe('what counts as spending', () => {
  it('is an expense that is not only money moving', () => {
    expect(isSpending(tx({ amount: -10 }))).toBe(true);
    expect(isSpending(tx({ amount: -10, paymentMethod: 'credit' }))).toBe(true);
    expect(isSpending(tx({ amount: 10 }))).toBe(false);
    expect(isSpending(tx({ amount: -10, categoryId: 'transfer', transferId: 4 }))).toBe(false);
    expect(isSpending(tx({ amount: -10, categoryId: 'invoice', invoiceMonth: '2026-10' }))).toBe(false);
  });
});

describe('spendingByCategory', () => {
  it('adds up the expenses of each category, the biggest first, leaving out the rest', () => {
    const totals = spendingByCategory([
      tx({ amount: -50 }),
      tx({ amount: -30, categoryId: 'transport', categoryName: 'Transporte', categoryIcon: 'car', categoryColor: '#3161B2' }),
      tx({ amount: -70 }),
      tx({ amount: 900, categoryId: 'salary' }),
      tx({ amount: -400, categoryId: 'invoice', invoiceMonth: '2026-10' }),
    ]);
    expect(totals.map((t) => [t.categoryId, t.total])).toEqual([
      ['food', 120],
      ['transport', 30],
    ]);
    expect(totals[0]).toMatchObject({ categoryName: 'Alimentação', icon: 'restaurant', color: '#E67E22' });
  });

  it('is empty without expenses', () => {
    expect(spendingByCategory([])).toEqual([]);
  });
});

describe('spendingByPayment', () => {
  it('splits the same spending by how it was paid, credit included', () => {
    const split = spendingByPayment([
      tx({ amount: -870, paymentMethod: 'pix' }),
      tx({ amount: -2750, paymentMethod: 'credit' }),
      tx({ amount: 2700, categoryId: 'salary' }),
      tx({ amount: -1560, categoryId: 'invoice', invoiceMonth: '2026-10' }),
    ]);
    expect(split.total).toBe(3620);
    expect(split.slices.map((s) => [s.kind, s.amount])).toEqual([
      ['pix', 870],
      ['credit', 2750],
    ]);
  });

  it('puts what says nothing about how it was paid in its own slice', () => {
    const split = spendingByPayment([tx({ amount: -40 }), tx({ amount: -60, paymentMethod: 'debit' })]);
    expect(split.slices.map((s) => s.kind)).toEqual(['debit', 'other']);
    expect(split.total).toBe(100);
  });

  it('gives whole percents that add up to 100', () => {
    const split = spendingByPayment([
      tx({ amount: -1100, paymentMethod: 'pix' }),
      tx({ amount: -820, paymentMethod: 'debit' }),
      tx({ amount: -1560, paymentMethod: 'credit' }),
    ]);
    expect(split.slices.map((s) => s.percent)).toEqual([32, 23, 45]);
  });

  it('is empty when nothing was spent', () => {
    expect(spendingByPayment([])).toEqual({ total: 0, slices: [] });
  });
});
