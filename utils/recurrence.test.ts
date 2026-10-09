import {
  dueOccurrences,
  futureMonths,
  installmentSummary,
  lastMonthOf,
  nextOccurrence,
  occurrenceDate,
  occurrenceIn,
  plannedTransactions,
  recurrenceBadge,
} from './recurrence';
import { type RecurrenceRecord } from './recurrence-type';

const NOW = new Date('2026-10-09T12:00:00.000Z');

function recurrence(overrides: Partial<RecurrenceRecord> = {}): RecurrenceRecord {
  return {
    id: 1,
    cardId: 1,
    cardName: 'Cartão Principal',
    categoryId: 'shopping',
    categoryName: 'Shopping',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Parcela do celular',
    description: null,
    amount: 150,
    day: 20,
    startMonth: '2026-09',
    firstInstallment: 3,
    total: 10,
    endMonth: null,
    generatedUntil: '2026-09',
    ...overrides,
  };
}

const monthly = (overrides: Partial<RecurrenceRecord> = {}) =>
  recurrence({ id: 2, name: 'Academia', amount: 119.9, day: 3, firstInstallment: 1, total: null, ...overrides });

describe('occurrenceDate', () => {
  it('is the due day, at noon UTC', () => {
    expect(occurrenceDate('2026-10', 20)).toBe('2026-10-20T12:00:00.000Z');
  });

  it('falls on the last day of a month that is too short', () => {
    expect(occurrenceDate('2027-02', 31)).toBe('2027-02-28T12:00:00.000Z');
    expect(occurrenceDate('2028-02', 31)).toBe('2028-02-29T12:00:00.000Z');
    expect(occurrenceDate('2026-04', 31)).toBe('2026-04-30T12:00:00.000Z');
  });
});

describe('where a recurrence ends', () => {
  it('an installment plan ends in the month of its last payment', () => {
    // payment 3 of 10 in September: payment 10 is 7 months later
    expect(lastMonthOf(recurrence())).toBe('2027-04');
  });

  it('a monthly one has no end', () => {
    expect(lastMonthOf(monthly())).toBeNull();
  });

  it('ending it by hand stops it earlier than the plan, never later', () => {
    expect(lastMonthOf(recurrence({ endMonth: '2026-12' }))).toBe('2026-12');
    expect(lastMonthOf(recurrence({ endMonth: '2030-01' }))).toBe('2027-04');
    expect(lastMonthOf(monthly({ endMonth: '2026-12' }))).toBe('2026-12');
  });
});

describe('occurrenceIn', () => {
  it('numbers the payments from the one registered by hand', () => {
    expect(occurrenceIn(recurrence(), '2026-10')).toMatchObject({ month: '2026-10', installment: 4 });
    expect(occurrenceIn(recurrence(), '2027-04')).toMatchObject({ installment: 10 });
  });

  it('has none in the month of the first one, before it, or after the last', () => {
    expect(occurrenceIn(recurrence(), '2026-09')).toBeNull();
    expect(occurrenceIn(recurrence(), '2026-08')).toBeNull();
    expect(occurrenceIn(recurrence(), '2027-05')).toBeNull();
  });

  it('a monthly one goes on and on', () => {
    expect(occurrenceIn(monthly(), '2030-01')).not.toBeNull();
  });
});

describe('dueOccurrences', () => {
  it('waits for the due day', () => {
    expect(dueOccurrences(recurrence(), new Date('2026-10-19T12:00:00.000Z'))).toEqual([]);
    expect(dueOccurrences(recurrence(), new Date('2026-10-20T12:00:00.000Z'))).toHaveLength(1);
  });

  it('catches up on every month missed, oldest first', () => {
    const due = dueOccurrences(recurrence(), new Date('2027-01-25T12:00:00.000Z'));
    expect(due.map((o) => o.month)).toEqual(['2026-10', '2026-11', '2026-12', '2027-01']);
    expect(due.map((o) => o.installment)).toEqual([4, 5, 6, 7]);
  });

  it('does not repeat what was already generated', () => {
    const generated = recurrence({ generatedUntil: '2026-11' });
    const due = dueOccurrences(generated, new Date('2027-01-25T12:00:00.000Z'));
    expect(due.map((o) => o.month)).toEqual(['2026-12', '2027-01']);
  });

  it('stops at the last payment of the plan', () => {
    const due = dueOccurrences(recurrence(), new Date('2028-01-01T12:00:00.000Z'));
    expect(due[due.length - 1]).toMatchObject({ month: '2027-04', installment: 10 });
  });

  it('stops where it was ended', () => {
    const ended = recurrence({ generatedUntil: '2026-10', endMonth: '2026-10' });
    expect(dueOccurrences(ended, new Date('2027-01-25T12:00:00.000Z'))).toEqual([]);
  });
});

describe('nextOccurrence', () => {
  it('is the one after what was generated', () => {
    expect(nextOccurrence(recurrence())).toMatchObject({ month: '2026-10', installment: 4 });
  });

  it('is null when the plan is over or it was ended', () => {
    expect(nextOccurrence(recurrence({ generatedUntil: '2027-04' }))).toBeNull();
    expect(nextOccurrence(recurrence({ endMonth: '2026-09' }))).toBeNull();
  });
});

describe('plannedTransactions', () => {
  const all = [
    recurrence(),
    recurrence({ id: 3, name: 'Notebook', amount: 320, day: 25, startMonth: '2026-09', firstInstallment: 1, total: 12 }),
    monthly({ day: 3 }),
  ];

  it('lists what falls in a month ahead, nearest first, as expenses marked planned', () => {
    const planned = plannedTransactions(all, '2026-11', NOW);
    expect(planned.map((t) => t.name)).toEqual(['Academia', 'Parcela do celular', 'Notebook']);
    expect(planned.every((t) => t.planned && t.type === 'expense' && t.amount < 0)).toBe(true);
    expect(planned[1].recurrence).toEqual({ id: 1, installment: 5, total: 10 });
    expect(planned[0].occurredAt).toBe('2026-11-03T12:00:00.000Z');
  });

  it('gives each row an id of its own, and negative', () => {
    const ids = plannedTransactions(all, '2026-11', NOW).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id < 0)).toBe(true);
  });

  it('is empty for the current month, past months and beyond the horizon', () => {
    expect(plannedTransactions(all, '2026-10', NOW)).toEqual([]);
    expect(plannedTransactions(all, '2026-09', NOW)).toEqual([]);
    expect(plannedTransactions(all, '2027-05', NOW)).toEqual([]);
  });

  it('can be limited to one account', () => {
    const other = [recurrence(), monthly({ cardId: 2 })];
    expect(plannedTransactions(other, '2026-11', NOW, { cardId: 2 }).map((t) => t.name)).toEqual(['Academia']);
  });
});

describe('futureMonths', () => {
  it('lists only the months with something planned, with what they add up to', () => {
    const list = [recurrence({ total: 3, firstInstallment: 1, startMonth: '2026-09' }), monthly()];
    // the plan has payments in Oct (2) and Nov (3); the monthly one goes on
    const months = futureMonths(list, [{ month: '0000-00', amount: 1000 }], NOW);
    expect(months[0]).toMatchObject({ month: '2026-11', count: 2, installments: 1 });
    expect(months[0].total).toBeCloseTo(269.9);
    expect(months[0].budgetUse).toBeCloseTo(0.2699);
    // from December only the monthly one is left
    expect(months[1]).toMatchObject({ month: '2026-12', count: 1, installments: 0 });
  });

  it('stops at the horizon', () => {
    const months = futureMonths([monthly()], [], NOW);
    expect(months).toHaveLength(6);
    expect(months[5].month).toBe('2027-04');
    expect(months[0].budget).toBeNull();
    expect(months[0].budgetUse).toBeNull();
  });
});

describe('installmentSummary', () => {
  it('counts what is left from the payment the person is on', () => {
    expect(installmentSummary({ total: 10, current: 4, amount: 150, startMonth: '2026-10' })).toEqual({
      remaining: 7,
      remainingTotal: 1050,
      lastMonth: '2027-04',
    });
  });

  it('a plan that starts at the first payment has all of them left', () => {
    expect(installmentSummary({ total: 10, current: 1, amount: 150, startMonth: '2026-10' })).toMatchObject({
      remaining: 10,
      lastMonth: '2027-07',
    });
  });
});

describe('recurrenceBadge', () => {
  it('shows the payment of an installment plan, or "Todo mês"', () => {
    expect(recurrenceBadge({ installment: 4, total: 10 })).toBe('4/10');
    expect(recurrenceBadge({ installment: null, total: null })).toBe('Todo mês');
  });
});
