import { type TransactionRecord } from '@/db/transactions';
import { creditUsage, installmentsToCome } from './creditLimit';
import { type RecurrenceRecord } from './recurrence-type';

let id = 1;

function purchase(amount: number, overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: id++,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'shopping',
    categoryName: 'Compras',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Compra',
    description: null,
    amount: -amount,
    type: 'expense',
    occurredAt: '2026-10-20T12:00:00.000Z',
    createdAt: '2026-10-20T12:00:00.000Z',
    paymentMethod: 'credit',
    ...overrides,
  };
}

const payment = (amount: number, overrides: Partial<TransactionRecord> = {}) =>
  purchase(amount, { categoryId: 'invoice', paymentMethod: null, invoiceMonth: '2026-10', ...overrides });

function plan(overrides: Partial<RecurrenceRecord> = {}): RecurrenceRecord {
  return {
    id: 1,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'shopping',
    categoryName: 'Compras',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Notebook',
    description: null,
    amount: 500,
    day: 10,
    startMonth: '2026-10',
    firstInstallment: 1,
    total: 10,
    endMonth: null,
    generatedUntil: '2026-10',
    paymentMethod: 'credit',
    ...overrides,
  };
}

describe('installmentsToCome', () => {
  it('counts the installments after the last one the server made', () => {
    // 10 payments, the 1st in October: the 2nd to the 10th are still to come.
    expect(installmentsToCome(plan())).toBe(9);
  });

  it('shrinks as the server makes the next ones', () => {
    expect(installmentsToCome(plan({ generatedUntil: '2026-12' }))).toBe(7);
    expect(installmentsToCome(plan({ generatedUntil: '2027-07' }))).toBe(0);
  });

  it('starts from the installment the person is on', () => {
    // a "4 of 10" plan started in October: 5 to 10 are left
    expect(installmentsToCome(plan({ firstInstallment: 4 }))).toBe(6);
  });

  it('stops where the plan was ended by hand', () => {
    expect(installmentsToCome(plan({ endMonth: '2026-12' }))).toBe(2);
  });

  it('counts nothing for a monthly expense without end, or one not paid on credit', () => {
    expect(installmentsToCome(plan({ total: null }))).toBe(0);
    expect(installmentsToCome(plan({ paymentMethod: 'pix' }))).toBe(0);
    expect(installmentsToCome(plan({ paymentMethod: null }))).toBe(0);
  });
});

describe('creditUsage', () => {
  const base = { limit: 3000, cardId: 1, recurrences: [] as RecurrenceRecord[] };

  it('is all free with nothing bought', () => {
    const usage = creditUsage({ ...base, purchases: [], payments: [] });
    expect(usage).toEqual({ limit: 3000, owed: 0, committed: 0, used: 0, available: 3000, useShare: 0 });
  });

  it('takes what was bought on credit and not paid out of the limit', () => {
    const usage = creditUsage({ ...base, purchases: [purchase(500), purchase(250.5)], payments: [] });
    expect(usage.owed).toBe(750.5);
    expect(usage.available).toBe(2249.5);
    expect(usage.useShare).toBeCloseTo(0.25, 2);
  });

  it('gives the limit back when an invoice is paid', () => {
    const usage = creditUsage({ ...base, purchases: [purchase(500), purchase(300)], payments: [payment(500)] });
    expect(usage.owed).toBe(300);
    expect(usage.available).toBe(2700);
  });

  it('gives back all of it once everything is paid, and never goes below zero owed', () => {
    const paidInFull = creditUsage({ ...base, purchases: [purchase(500)], payments: [payment(500)] });
    expect(paidInFull.available).toBe(3000);
    // a payment bigger than what the app knows of (a debt from before the app) is not a credit
    const overpaid = creditUsage({ ...base, purchases: [purchase(500)], payments: [payment(800)] });
    expect(overpaid.owed).toBe(0);
    expect(overpaid.available).toBe(3000);
  });

  it('ignores what was not bought on credit, planned rows and other accounts', () => {
    const usage = creditUsage({
      ...base,
      purchases: [
        purchase(100),
        purchase(900, { paymentMethod: 'pix' }),
        purchase(900, { paymentMethod: null }),
        purchase(900, { planned: true }),
        purchase(900, { cardId: 2 }),
        purchase(900, { type: 'income', amount: 900 }),
      ],
      payments: [payment(40, { cardId: 2 })],
    });
    expect(usage.owed).toBe(100);
  });

  it('keeps aside the installments still to come, and they do not count twice once made', () => {
    // 10 x 500 bought in October, only the first made so far
    const open = creditUsage({ ...base, purchases: [purchase(500)], payments: [], recurrences: [plan()] });
    expect(open.owed).toBe(500);
    expect(open.committed).toBe(4500);
    expect(open.used).toBe(5000);
    expect(open.available).toBe(-2000);
    // the server made the second one: the debt grew by 500 and what is to come shrank by 500
    const next = creditUsage({
      ...base,
      purchases: [purchase(500), purchase(500)],
      payments: [],
      recurrences: [plan({ generatedUntil: '2026-11' })],
    });
    expect(next.used).toBe(open.used);
  });

  it('only counts the plans of this account', () => {
    const usage = creditUsage({ ...base, purchases: [], payments: [], recurrences: [plan({ cardId: 2 })] });
    expect(usage.committed).toBe(0);
  });

  it('shows a card over its limit as a negative balance', () => {
    const usage = creditUsage({ ...base, purchases: [purchase(3500)], payments: [] });
    expect(usage.available).toBe(-500);
    expect(usage.useShare).toBeGreaterThan(1);
  });

  it('has no share without a limit', () => {
    expect(creditUsage({ ...base, limit: 0, purchases: [purchase(10)], payments: [] }).useShare).toBe(0);
  });
});
