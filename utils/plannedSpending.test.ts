import { futureSpendingMonths, plannedBySpendingMonth } from '@/utils/plannedSpending';
import { type InvoiceRules } from '@/utils/invoice-type';
import { type RecurrenceRecord } from '@/utils/recurrence-type';

// Today is 24/10/2026. The card closes on the 25th and is due on the 5th of the next month.
const NOW = new Date('2026-10-24T15:00:00.000Z');
const FECHA_25_VENCE_5: InvoiceRules = { closingDay: 25, dueDay: 5 };
const rulesOf = (cardId: number): InvoiceRules | null => (cardId === 1 ? FECHA_25_VENCE_5 : null);

// The 3rd of 4 installments on credit, registered on 24/10 (it counts in November): the 4th falls on 24/11.
function plan(overrides: Partial<RecurrenceRecord> = {}): RecurrenceRecord {
  return {
    id: 7,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'shopping',
    categoryName: 'Compras',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Notebook',
    description: null,
    amount: 189.9,
    day: 24,
    startMonth: '2026-10',
    firstInstallment: 3,
    total: 4,
    endMonth: null,
    generatedUntil: '2026-10',
    paymentMethod: 'credit',
    ...overrides,
  };
}

describe('plannedBySpendingMonth', () => {
  it('puts the 4th installment (24/11, before the closing on the 25th) in the month its invoice is due: December', () => {
    expect(plannedBySpendingMonth([plan()], '2026-11', NOW, rulesOf)).toEqual([]);
    const december = plannedBySpendingMonth([plan()], '2026-12', NOW, rulesOf);
    expect(december).toHaveLength(1);
    expect(december[0]).toMatchObject({
      name: 'Notebook',
      planned: true,
      amount: -189.9,
      spendingMonth: '2026-12',
      spendingDay: 5,
      recurrence: { installment: 4, total: 4 },
    });
    expect(december[0].occurredAt).toBe('2026-11-24T12:00:00.000Z');
  });

  it('an installment bought a day after the closing counts one month later', () => {
    // On the 26th: after the closing on the 25th, so the invoice closes in the next month and is due the month after.
    const late = plan({ day: 26 });
    expect(plannedBySpendingMonth([late], '2026-12', NOW, rulesOf)).toEqual([]);
    expect(plannedBySpendingMonth([late], '2027-01', NOW, rulesOf)).toHaveLength(1);
  });

  it('without the card days (or not on credit) an installment counts in the month of its day', () => {
    const pix = plan({ paymentMethod: 'pix' });
    expect(plannedBySpendingMonth([pix], '2026-11', NOW, rulesOf)).toHaveLength(1);
    expect(plannedBySpendingMonth([pix], '2026-12', NOW, rulesOf)).toEqual([]);
    const noCard = plan({ cardId: 2 });
    expect(plannedBySpendingMonth([noCard], '2026-11', NOW, rulesOf)).toHaveLength(1);
  });

  it('does not repeat what already happened: an occurrence of this month that fell due is a transaction', () => {
    // 20/10 was due (before now): it is not planned, whatever month it counts in.
    const earlier = plan({ day: 20, startMonth: '2026-09', firstInstallment: 2, generatedUntil: '2026-10' });
    const planned = [
      ...plannedBySpendingMonth([earlier], '2026-11', NOW, rulesOf),
      ...plannedBySpendingMonth([earlier], '2026-12', NOW, rulesOf),
    ];
    expect(planned.map((t) => t.occurredAt)).toEqual(['2026-11-20T12:00:00.000Z']);
  });

  it('is empty for a month that already began and for one past the horizon', () => {
    expect(plannedBySpendingMonth([plan()], '2026-10', NOW, rulesOf)).toEqual([]);
    expect(plannedBySpendingMonth([plan()], '2027-06', NOW, rulesOf)).toEqual([]);
  });

  it('can be limited to one account', () => {
    expect(plannedBySpendingMonth([plan()], '2026-12', NOW, rulesOf, { cardId: 2 })).toEqual([]);
    expect(plannedBySpendingMonth([plan()], '2026-12', NOW, rulesOf, { cardId: 1 })).toHaveLength(1);
  });
});

describe('futureSpendingMonths', () => {
  it('adds what is already registered to what is planned, month by month', () => {
    const registered = new Map([
      ['2026-11', 800],
      ['2027-02', 50],
    ]);
    const months = futureSpendingMonths([plan()], [{ month: '0000-00', amount: 3500 }], registered, NOW, rulesOf);
    expect(months.map((m) => m.month)).toEqual(['2026-11', '2026-12', '2027-02']);
    expect(months[0]).toMatchObject({ total: 800, registered: 800, count: 0 });
    expect(months[1]).toMatchObject({ total: 189.9, registered: 0, count: 1, installments: 1 });
    expect(months[1].budgetUse).toBeCloseTo(189.9 / 3500);
    expect(months[2]).toMatchObject({ total: 50, registered: 50, count: 0 });
  });
});
