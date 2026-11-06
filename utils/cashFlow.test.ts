import { type TransactionRecord } from '@/db/transactions';
import { buildFlow, cashOf, cashPosition, monthChange, movedMoney, savedInMonth } from './cashFlow';
import { type GoalEntryRecord } from './goals-type';

let nextId = 1;

function expense(amount: number, overrides: Partial<TransactionRecord> = {}): TransactionRecord {
  return {
    id: nextId++,
    cardId: 1,
    cardName: 'Conta',
    categoryId: 'food',
    categoryName: 'Alimentação',
    categoryIcon: 'restaurant',
    categoryColor: '#E67E22',
    name: 'Item',
    description: null,
    amount: -amount,
    type: 'expense',
    occurredAt: '2026-11-03T12:00:00.000Z',
    createdAt: '2026-11-03T12:00:00.000Z',
    ...overrides,
  };
}

const income = (amount: number, overrides: Partial<TransactionRecord> = {}) =>
  expense(amount, { categoryId: 'salary', categoryName: 'Salário', amount, type: 'income', ...overrides });

const onCredit = (amount: number) => expense(amount, { paymentMethod: 'credit' });
const invoicePayment = (amount: number) =>
  expense(amount, { categoryId: 'invoice', categoryName: 'Fatura do cartão', paymentMethod: null, invoiceMonth: '2026-11' });
const entry = (amount: number, occurredAt: string): GoalEntryRecord => ({ id: nextId++, goalId: 1, amount, occurredAt });

describe('movedMoney', () => {
  it('is true for what left or came into an account at once, however it was paid', () => {
    expect(movedMoney(expense(10))).toBe(true);
    expect(movedMoney(expense(10, { paymentMethod: 'pix' }))).toBe(true);
    expect(movedMoney(expense(10, { paymentMethod: 'debit' }))).toBe(true);
    expect(movedMoney(income(10))).toBe(true);
  });

  it('is false for a purchase on credit: it waits in the invoice', () => {
    expect(movedMoney(onCredit(10))).toBe(false);
  });

  it('is false for the legs of a transfer, which cancel each other, and for a row that is only planned', () => {
    expect(movedMoney(expense(10, { transferId: 7 }))).toBe(false);
    expect(movedMoney(expense(10, { planned: true }))).toBe(false);
  });

  it('is true for the payment of an invoice: that is when the money leaves', () => {
    expect(movedMoney(invoicePayment(10))).toBe(true);
  });
});

describe('cashOf', () => {
  it('adds up what came in and what went out, leaving the purchases on credit out', () => {
    const cash = cashOf([income(2750), expense(100), expense(50, { paymentMethod: 'pix' }), onCredit(900)]);
    expect(cash).toEqual({ income: 2750, outflow: 150 });
  });

  it('counts the payment of an invoice as an outflow', () => {
    const cash = cashOf([income(1000), onCredit(900), invoicePayment(900)]);
    expect(cash).toEqual({ income: 1000, outflow: 900 });
  });

  it('leaves the transfers out: money moved between accounts is neither', () => {
    const cash = cashOf([expense(500, { transferId: 3 }), income(500, { transferId: 3 }), expense(20)]);
    expect(cash).toEqual({ income: 0, outflow: 20 });
  });

  it('is zero for nothing', () => {
    expect(cashOf([])).toEqual({ income: 0, outflow: 0 });
  });

  it('does not drift on cents', () => {
    expect(cashOf([expense(0.1), expense(0.2)]).outflow).toBe(0.3);
  });
});

describe('savedInMonth', () => {
  it('adds what was put into the caixinhas and takes off what was taken out, in that month only', () => {
    const entries = [
      entry(300, '2026-11-10T15:00:00.000Z'),
      entry(-50, '2026-11-20T15:00:00.000Z'),
      entry(1000, '2026-10-15T15:00:00.000Z'),
    ];
    expect(savedInMonth(entries, '2026-11')).toBe(250);
    expect(savedInMonth(entries, '2026-10')).toBe(1000);
    expect(savedInMonth(entries, '2026-09')).toBe(0);
  });
});

describe('monthChange', () => {
  it('is what came in, less what went out and what was set aside', () => {
    expect(monthChange({ income: 2750, outflow: 1000 }, 300)).toBe(1450);
  });

  it('can be negative', () => {
    expect(monthChange({ income: 100, outflow: 400 }, 0)).toBe(-300);
  });
});

describe('cashPosition', () => {
  it('ends the current month at what can be spent today, and started it before what the month did', () => {
    const position = cashPosition({ availableNow: 2004.51, month: '2026-11', currentMonth: '2026-11', change: 946.2, changesAfter: [] });
    expect(position).toEqual({ closing: 2004.51, opening: 1058.31, change: 946.2 });
  });

  it('goes back from today to the end of an older month, taking off what the months after it did', () => {
    // today 1000; December did +200 and November (the current one) did -50: October ended at 1000 - (-50) - 200 = 850
    const position = cashPosition({ availableNow: 1000, month: '2026-10', currentMonth: '2026-12', change: 120, changesAfter: [-50, 200] });
    expect(position.closing).toBe(850);
    expect(position.opening).toBe(730);
  });

  it('does not take off anything for the current month', () => {
    const position = cashPosition({ availableNow: 500, month: '2026-11', currentMonth: '2026-11', change: 0, changesAfter: [999] });
    expect(position.closing).toBe(500);
  });

  it('can be negative: more was set aside or paid than there was', () => {
    expect(cashPosition({ availableNow: -80, month: '2026-11', currentMonth: '2026-11', change: 20, changesAfter: [] }).closing).toBe(-80);
  });

  // The case that started this: an invoice was paid and the Saldo did not move.
  it('drops when an invoice is paid, and the start of the month stays where it was', () => {
    const purchases = [income(500), expense(100), onCredit(300)];

    // Before paying: the credit purchase is not in the accounts, so only the 500 in and the 100 out are.
    const before = cashOf(purchases);
    const availableBefore = 1000 + 500 - 100;
    const positionBefore = cashPosition({
      availableNow: availableBefore,
      month: '2026-11',
      currentMonth: '2026-11',
      change: monthChange(before, 0),
      changesAfter: [],
    });
    expect(positionBefore).toEqual({ closing: 1400, opening: 1000, change: 400 });

    // After paying 300: the accounts have 300 less, and the payment is an outflow of the month.
    const after = cashOf([...purchases, invoicePayment(300)]);
    const positionAfter = cashPosition({
      availableNow: availableBefore - 300,
      month: '2026-11',
      currentMonth: '2026-11',
      change: monthChange(after, 0),
      changesAfter: [],
    });
    expect(positionAfter).toEqual({ closing: 1100, opening: 1000, change: 100 });
  });

  it('drops when money is put into a caixinha, and the start of the month stays where it was', () => {
    // Accounts 1500, 400 of it already reserved before; 200 more reserved this month.
    const available = 1500 - (400 + 200);
    const position = cashPosition({
      availableNow: available,
      month: '2026-11',
      currentMonth: '2026-11',
      change: monthChange({ income: 300, outflow: 100 }, 200),
      changesAfter: [],
    });
    expect(position).toEqual({ closing: 900, opening: 900, change: 0 });
  });
});

describe('buildFlow', () => {
  const NOW = new Date('2026-11-09T12:00:00.000Z');
  const previous = [
    income(2000, { occurredAt: '2026-10-05T12:00:00.000Z' }),
    income(1000, { occurredAt: '2026-10-25T12:00:00.000Z' }),
  ];

  it('is the cash that moved, the income against last month up to the same day, and how much of it went out', () => {
    const flow = buildFlow({ current: [income(2750), expense(1000), onCredit(5000)], previous, saved: 300, now: NOW });
    expect(flow).toEqual({ income: 2750, expense: 1000, saved: 300, incomeChange: 0.375, incomeUse: 1000 / 2750 });
  });

  it('has nothing to compare with, or to divide by, without income', () => {
    const flow = buildFlow({ current: [expense(10)], previous: [], saved: 0, now: NOW });
    expect(flow.incomeChange).toBeNull();
    expect(flow.incomeUse).toBeNull();
  });

  it('counts an invoice that was paid as spending, and one that was not as nothing yet', () => {
    expect(buildFlow({ current: [income(1000), onCredit(900)], previous: [], saved: 0, now: NOW }).expense).toBe(0);
    expect(buildFlow({ current: [income(1000), onCredit(900), invoicePayment(900)], previous: [], saved: 0, now: NOW }).expense).toBe(900);
  });
});
