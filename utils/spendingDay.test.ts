import { type TransactionRecord } from '@/db/transactions';
import { spendingDayInMonth } from './spendingDay';
import { buildSummary } from './summary';

function tx(overrides: Partial<TransactionRecord> & Pick<TransactionRecord, 'amount' | 'occurredAt'>): TransactionRecord {
  return {
    id: 1,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'other',
    categoryName: 'Outros',
    categoryIcon: 'category',
    categoryColor: '#95A5A6',
    name: 'Item',
    description: null,
    type: overrides.amount < 0 ? 'expense' : 'income',
    createdAt: overrides.occurredAt,
    ...overrides,
  };
}

describe('spendingDayInMonth', () => {
  it('is the day the money leaves when it is set, and the day of the transaction otherwise', () => {
    expect(spendingDayInMonth({ occurredAt: '2026-10-27T12:00:00.000Z', spendingDay: 10 })).toBe(10);
    expect(spendingDayInMonth({ occurredAt: '2026-10-27T12:00:00.000Z' })).toBe(27);
  });
});

describe('buildSummary with purchases on credit', () => {
  // October is the month before. A purchase of 27/09 on credit counts in October, on the 10th (the day its invoice
  // is due): up to the 5th of November it is not in the comparison yet, up to the 12th it is.
  const previous = [
    tx({ amount: 1000, occurredAt: '2026-10-02T12:00:00.000Z' }),
    tx({ amount: -300, occurredAt: '2026-09-27T12:00:00.000Z', paymentMethod: 'credit', spendingDay: 10 }),
  ];

  it('compares up to the day the invoice is due, not the day of the purchase', () => {
    const early = buildSummary({ current: [], previous, budget: null, now: new Date('2026-11-05T12:00:00.000Z') });
    const late = buildSummary({ current: [], previous, budget: null, now: new Date('2026-11-12T12:00:00.000Z') });
    // On the 5th only the income of the 2nd counts; on the 12th the invoice is in as well.
    expect(early.netChange).toBe(-1000);
    expect(late.netChange).toBe(-700);
  });
});
