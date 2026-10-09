import { type TransactionRecord } from '@/db/transactions';
import { generateInsights } from './insightRules';
import { buildSummary } from './summary';
import { isTransfer, withoutTransfers } from './transfer';

const NOW = new Date('2026-10-09T12:00:00.000Z');
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

const salary = tx({ name: 'Salário', amount: 4000, categoryId: 'salary', categoryName: 'Salário' });
const market = tx({ name: 'Mercado', amount: -500 });
// 1000 moves from Nubank to Itaú: an expense in one account, an income in the other.
const transferOut = tx({ name: 'Para Itaú', amount: -1000, categoryId: 'transfer', categoryName: 'Transferência', transferId: 7 });
const transferIn = tx({ name: 'De Nubank', amount: 1000, cardId: 2, cardName: 'Itaú', categoryId: 'transfer', categoryName: 'Transferência', transferId: 7 });

describe('isTransfer / withoutTransfers', () => {
  it('knows the legs of a transfer', () => {
    expect(isTransfer(transferOut)).toBe(true);
    expect(isTransfer(transferIn)).toBe(true);
    expect(isTransfer(market)).toBe(false);
    expect(isTransfer({ transferId: null })).toBe(false);
  });

  it('takes both legs out of a list and keeps the rest', () => {
    expect(withoutTransfers([salary, transferOut, market, transferIn])).toEqual([salary, market]);
  });
});

describe('a transfer between accounts', () => {
  const base = { budget: 2500, previous: [], now: NOW };

  it('is neither income nor expense in the month', () => {
    const summary = buildSummary({ ...base, current: [salary, market, transferOut, transferIn] });
    expect(summary.income).toBe(4000);
    expect(summary.expense).toBe(500);
    expect(summary.net).toBe(3500);
    expect(summary.transactionCount).toBe(2);
  });

  it('does not use up the budget', () => {
    const summary = buildSummary({ ...base, current: [salary, market, transferOut] });
    expect(summary.budgetUse).toBeCloseTo(500 / 2500);
  });

  it('does not count in the comparison with the previous month either', () => {
    const before = [tx({ amount: 4000, categoryId: 'salary', occurredAt: '2026-09-03T12:00:00.000Z' }), transferOut];
    const summary = buildSummary({ current: [salary], previous: before, budget: null, now: NOW });
    expect(summary.netChange).toBe(0);
    expect(summary.incomeChange).toBe(0);
  });

  it('says nothing to the insights', () => {
    const only = generateInsights({ current: [transferOut, transferIn], previous: [], now: NOW });
    expect(only).toEqual([]);

    const withTransfer = generateInsights({ current: [salary, market, transferOut, transferIn], previous: [], now: NOW });
    const without = generateInsights({ current: [salary, market], previous: [], now: NOW });
    expect(withTransfer.map((i) => i.id)).toEqual(without.map((i) => i.id));
    expect(withTransfer.find((i) => i.id === 'balance')?.title).toBe(without.find((i) => i.id === 'balance')?.title);
  });
});
