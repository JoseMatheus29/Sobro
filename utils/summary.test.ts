import { type TransactionRecord } from '@/db/transactions';
import { buildSummary } from './summary';

// Friday, 9 October 2026.
const NOW = new Date('2026-10-09T12:00:00.000Z');

function tx(type: 'income' | 'expense', amount: number, occurredAt = '2026-10-05T12:00:00.000Z'): TransactionRecord {
  return {
    id: 1,
    cardId: 1,
    cardName: 'Cartão Principal',
    categoryId: 'other',
    categoryName: 'Outros',
    categoryIcon: 'category',
    categoryColor: '#95A5A6',
    name: 'Item',
    description: null,
    amount: type === 'expense' ? -amount : amount,
    type,
    occurredAt,
    createdAt: occurredAt,
  };
}

const september = (day: number) => `2026-09-${String(day).padStart(2, '0')}T12:00:00.000Z`;
const base = { current: [], previous: [], budget: null, now: NOW };

describe('buildSummary', () => {
  it('totals the month and its balance', () => {
    const summary = buildSummary({ ...base, current: [tx('income', 500), tx('expense', 200), tx('expense', 50)] });
    expect(summary.income).toBe(500);
    expect(summary.expense).toBe(250);
    expect(summary.net).toBe(250);
    expect(summary.transactionCount).toBe(3);
  });

  it('is empty for an empty month', () => {
    const summary = buildSummary(base);
    expect(summary).toEqual({
      income: 0,
      expense: 0,
      net: 0,
      transactionCount: 0,
      netChange: null,
      incomeChange: null,
      incomeUse: null,
      budgetUse: null,
    });
  });

  describe('against the previous month', () => {
    it('says how much better the balance is than the same stretch of last month', () => {
      const summary = buildSummary({
        ...base,
        current: [tx('income', 1000), tx('expense', 200)],
        previous: [tx('income', 600, september(3)), tx('expense', 100, september(4))],
      });
      // 800 now against 500 then.
      expect(summary.netChange).toBe(300);
    });

    it('is negative when the month is behind', () => {
      const summary = buildSummary({
        ...base,
        current: [tx('income', 100)],
        previous: [tx('income', 600, september(3))],
      });
      expect(summary.netChange).toBe(-500);
    });

    it('only counts last month up to today, not all of it', () => {
      const summary = buildSummary({
        ...base,
        current: [tx('income', 1000)],
        previous: [tx('income', 600, september(3)), tx('expense', 5000, september(20))],
      });
      expect(summary.netChange).toBe(400);
    });

    it('has nothing to compare with when last month had nothing so far', () => {
      const summary = buildSummary({
        ...base,
        current: [tx('income', 1000)],
        previous: [tx('income', 600, september(20))],
      });
      expect(summary.netChange).toBeNull();
    });

    it('compares income with the same stretch of last month', () => {
      const summary = buildSummary({
        ...base,
        current: [tx('income', 1200)],
        previous: [tx('income', 1000, september(3)), tx('income', 5000, september(25))],
      });
      expect(summary.incomeChange).toBeCloseTo(0.2);
    });

    it('has no income change without income last month', () => {
      const summary = buildSummary({ ...base, current: [tx('income', 1200)] });
      expect(summary.incomeChange).toBeNull();
    });
  });

  it('shows how much of the income went out', () => {
    const summary = buildSummary({ ...base, current: [tx('income', 1000), tx('expense', 420)] });
    expect(summary.incomeUse).toBeCloseTo(0.42);
  });

  it('has no income use without income', () => {
    const summary = buildSummary({ ...base, current: [tx('expense', 420)] });
    expect(summary.incomeUse).toBeNull();
  });

  it('measures the spending against the budget', () => {
    const summary = buildSummary({ ...base, budget: 1000, current: [tx('expense', 570)] });
    expect(summary.budgetUse).toBeCloseTo(0.57);
  });

  it('can pass the budget', () => {
    const summary = buildSummary({ ...base, budget: 500, current: [tx('expense', 750)] });
    expect(summary.budgetUse).toBeCloseTo(1.5);
  });

  it('has no budget use without a budget, or with a zero one', () => {
    expect(buildSummary({ ...base, current: [tx('expense', 10)] }).budgetUse).toBeNull();
    expect(buildSummary({ ...base, budget: 0, current: [tx('expense', 10)] }).budgetUse).toBeNull();
  });
});
