import { type TransactionRecord } from '@/db/transactions';
import {
  buildInvoice,
  closesOn,
  cycleMonths,
  daysBetween,
  dueOn,
  invoiceMonthOf,
  lastPlannedInvoice,
  openInvoiceMonth,
  opensOn,
  plannedPurchases,
  todayKey,
} from './invoice';
import { type RecurrenceRecord } from './recurrence-type';

// Closes on the 3rd, falls due on the 10th: the example of the API guide.
const RULES = { closingDay: 3, dueDay: 10 };
let id = 1;

function purchase(day: string, amount: number, overrides: Partial<TransactionRecord> = {}): TransactionRecord {
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
    occurredAt: `${day}T12:00:00.000Z`,
    createdAt: `${day}T12:00:00.000Z`,
    paymentMethod: 'credit',
    ...overrides,
  };
}

const payment = (month: string, amount: number) =>
  purchase('2026-11-10', amount, { categoryId: 'invoice', paymentMethod: null, invoiceMonth: month });

describe('which invoice a purchase falls in', () => {
  it('goes into the invoice of the month up to the closing day, and into the next one after it', () => {
    expect(invoiceMonthOf('2026-10-07', RULES)).toBe('2026-11');
    expect(invoiceMonthOf('2026-11-03', RULES)).toBe('2026-11');
    expect(invoiceMonthOf('2026-11-04', RULES)).toBe('2026-12');
    expect(invoiceMonthOf('2026-10-01', RULES)).toBe('2026-10');
  });

  it('rolls the year over', () => {
    expect(invoiceMonthOf('2026-12-20', RULES)).toBe('2027-01');
  });

  it('uses the last day of a shorter month when the closing day does not exist there', () => {
    const rules = { closingDay: 31, dueDay: 10 };
    expect(closesOn('2026-02', rules)).toBe('2026-02-28');
    expect(invoiceMonthOf('2026-02-28', rules)).toBe('2026-02');
    expect(invoiceMonthOf('2026-04-30', rules)).toBe('2026-04');
  });

  it('tells which invoice is taking purchases today', () => {
    expect(openInvoiceMonth('2026-10-16', RULES)).toBe('2026-11');
    expect(openInvoiceMonth('2026-11-03', RULES)).toBe('2026-11');
    expect(openInvoiceMonth('2026-11-04', RULES)).toBe('2026-12');
  });
});

describe('the days of an invoice', () => {
  it('opens the day after the previous one closed and closes on the closing day', () => {
    expect(opensOn('2026-11', RULES)).toBe('2026-10-04');
    expect(closesOn('2026-11', RULES)).toBe('2026-11-03');
    expect(opensOn('2027-01', RULES)).toBe('2026-12-04');
  });

  it('falls due in the month it closes in when the due day is after the closing day, otherwise in the next', () => {
    expect(dueOn('2026-11', RULES)).toBe('2026-11-10');
    expect(dueOn('2026-11', { closingDay: 25, dueDay: 5 })).toBe('2026-12-05');
    expect(dueOn('2026-12', { closingDay: 25, dueDay: 5 })).toBe('2027-01-05');
    expect(dueOn('2026-01', { closingDay: 5, dueDay: 31 })).toBe('2026-01-31');
    expect(dueOn('2026-02', { closingDay: 5, dueDay: 31 })).toBe('2026-02-28');
  });

  it('says which calendar months the cycle has to be read from', () => {
    expect(cycleMonths('2026-11', RULES)).toEqual(['2026-10', '2026-11']);
    expect(cycleMonths('2026-11', { closingDay: 30, dueDay: 10 })).toEqual(['2026-10', '2026-11']);
    // A cycle that opens on the 1st lives in one month: the previous one closed on the last day.
    expect(cycleMonths('2026-11', { closingDay: 31, dueDay: 10 })).toEqual(['2026-11']);
    expect(cycleMonths('2026-03', { closingDay: 28, dueDay: 10 })).toEqual(['2026-03']);
  });
});

describe('buildInvoice', () => {
  const today = '2026-10-16';
  const purchases = [
    purchase('2026-10-04', 180),
    purchase('2026-10-20', 39.9),
    purchase('2026-11-03', 20.1),
    // After the closing day: the next invoice.
    purchase('2026-11-04', 500),
    // Before the cycle: the previous invoice.
    purchase('2026-10-03', 70),
    // Not on credit: never in an invoice.
    purchase('2026-10-10', 15, { paymentMethod: 'pix' }),
  ];

  it('adds up what was bought on credit in the cycle', () => {
    const invoice = buildInvoice({ month: '2026-11', rules: RULES, purchases, payments: [], today });
    expect(invoice.total).toBeCloseTo(240);
    expect(invoice.purchases.map((p) => Math.abs(p.amount))).toEqual([20.1, 39.9, 180]);
    expect(invoice.opensOn).toBe('2026-10-04');
    expect(invoice.closesOn).toBe('2026-11-03');
    expect(invoice.dueOn).toBe('2026-11-10');
    expect(invoice.status).toBe('open');
    expect(invoice.remaining).toBeCloseTo(240);
  });

  it('subtracts the payments of that invoice only', () => {
    const invoice = buildInvoice({
      month: '2026-11',
      rules: RULES,
      purchases,
      payments: [payment('2026-11', 100), payment('2026-10', 999)],
      today,
    });
    expect(invoice.paid).toBeCloseTo(100);
    expect(invoice.remaining).toBeCloseTo(140);
  });

  it('is open until the closing day, then closed, overdue after the due day, and paid once nothing is left', () => {
    const at = (day: string, pay: number[] = []) =>
      buildInvoice({
        month: '2026-11',
        rules: RULES,
        purchases,
        payments: pay.map((p) => payment('2026-11', p)),
        today: day,
      }).status;
    expect(at('2026-11-03')).toBe('open');
    expect(at('2026-11-04')).toBe('closed');
    expect(at('2026-11-10')).toBe('closed');
    expect(at('2026-11-11')).toBe('overdue');
    expect(at('2026-11-05', [240])).toBe('paid');
    expect(at('2026-11-20', [100, 140])).toBe('paid');
    // An invoice without purchases has nothing to pay.
    expect(
      buildInvoice({ month: '2027-03', rules: RULES, purchases, payments: [], today: '2027-04-01' }).status
    ).toBe('paid');
  });

  it('never goes below zero when paid a bit too much', () => {
    const invoice = buildInvoice({
      month: '2026-11',
      rules: RULES,
      purchases,
      payments: [payment('2026-11', 300)],
      today: '2026-11-20',
    });
    expect(invoice.remaining).toBe(0);
    expect(invoice.status).toBe('paid');
  });
});

describe('plannedPurchases', () => {
  const recurrence: RecurrenceRecord = {
    id: 7,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'shopping',
    categoryName: 'Compras',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Celular',
    description: null,
    amount: 150,
    day: 28,
    startMonth: '2026-08',
    firstInstallment: 1,
    total: 10,
    endMonth: null,
    generatedUntil: '2026-10',
    paymentMethod: 'credit',
  };

  it('puts the occurrence still to come in the invoice its day falls in', () => {
    // 28 Nov is after the closing day: it belongs to the December invoice, not to the one that closes on 3 Nov.
    const december = plannedPurchases([recurrence], '2026-12', RULES, 1);
    expect(december).toHaveLength(1);
    expect(december[0]).toMatchObject({ planned: true, amount: -150, paymentMethod: 'credit' });
    expect(december[0].recurrence?.installment).toBe(4);
    expect(plannedPurchases([recurrence], '2026-11', RULES, 1)).toHaveLength(0);
  });

  it('leaves out what was already made, other accounts and what is not on credit', () => {
    expect(plannedPurchases([{ ...recurrence, generatedUntil: '2026-11' }], '2026-12', RULES, 1)).toHaveLength(0);
    expect(plannedPurchases([recurrence], '2026-12', RULES, 2)).toHaveLength(0);
    expect(plannedPurchases([{ ...recurrence, paymentMethod: 'pix' }], '2026-12', RULES, 1)).toHaveLength(0);
  });

  it('counts in the value of the invoice, saying how much of it is only planned', () => {
    const planned = plannedPurchases([recurrence], '2026-12', RULES, 1);
    const invoice = buildInvoice({
      month: '2026-12',
      rules: RULES,
      purchases: [],
      payments: [],
      planned,
      today: '2026-10-16',
    });
    expect(invoice.total).toBe(150);
    expect(invoice.plannedTotal).toBe(150);
    expect(invoice.purchases).toHaveLength(1);
    // Nothing was bought yet, so there is nothing to pay yet.
    expect(invoice.remaining).toBe(0);
  });

  it('adds to what was already bought, and only what was bought can be paid', () => {
    const planned = plannedPurchases([recurrence], '2026-12', RULES, 1);
    const bought = purchase('2026-11-10', 80);
    const invoice = buildInvoice({
      month: '2026-12',
      rules: RULES,
      purchases: [bought],
      payments: [],
      planned,
      today: '2026-11-20',
    });
    expect(invoice.total).toBe(230);
    expect(invoice.plannedTotal).toBe(150);
    expect(invoice.remaining).toBe(80);
  });
});

describe('lastPlannedInvoice', () => {
  const plan = (overrides: Partial<RecurrenceRecord> = {}): RecurrenceRecord => ({
    id: 9,
    cardId: 1,
    cardName: 'Nubank',
    categoryId: 'shopping',
    categoryName: 'Compras',
    categoryIcon: 'shopping-bag',
    categoryColor: '#9B59B6',
    name: 'Notebook',
    description: null,
    amount: 25,
    day: 16,
    startMonth: '2026-10',
    firstInstallment: 1,
    total: 10,
    endMonth: null,
    generatedUntil: '2026-10',
    paymentMethod: 'credit',
    ...overrides,
  });

  it('is the invoice the last installment falls in', () => {
    // 10 payments from October: the last is on 16 July 2027, which is in the August invoice.
    expect(lastPlannedInvoice([plan()], RULES, 1)).toBe('2027-08');
  });

  it('takes the furthest of several plans and skips what has no end, other cards and other ways to pay', () => {
    const longer = plan({ id: 10, total: 12 });
    expect(lastPlannedInvoice([plan(), longer], RULES, 1)).toBe('2027-10');
    expect(lastPlannedInvoice([plan({ total: null })], RULES, 1)).toBeNull();
    expect(lastPlannedInvoice([plan()], RULES, 2)).toBeNull();
    expect(lastPlannedInvoice([plan({ paymentMethod: 'pix' })], RULES, 1)).toBeNull();
  });
});

describe('days', () => {
  it('reads the phone calendar and counts days', () => {
    expect(todayKey(new Date(2026, 9, 16, 22, 30))).toBe('2026-10-16');
    expect(daysBetween('2026-10-16', '2026-11-03')).toBe(18);
    expect(daysBetween('2026-11-10', '2026-11-03')).toBe(-7);
  });
});

// A card that closes on the 11th: the case a tester reported. Bought on 23 Oct, after the invoice of October
// closed, the purchase belongs to the invoice of November, not to the one that is already closed.
describe('a card that closes on the 11th', () => {
  const rules = { closingDay: 11, dueDay: 18 };

  it('sends a purchase made after the closing day to the next month\'s invoice', () => {
    expect(invoiceMonthOf('2026-10-23', rules)).toBe('2026-11');
    expect(openInvoiceMonth('2026-10-23', rules)).toBe('2026-11');
  });

  it('keeps it out of the invoice that already closed and puts it in the open one', () => {
    const bought = purchase('2026-10-23', 80);
    const today = '2026-10-23';
    const october = buildInvoice({ month: '2026-10', rules, purchases: [bought], payments: [], today });
    const november = buildInvoice({ month: '2026-11', rules, purchases: [bought], payments: [], today });

    expect(october.purchases).toHaveLength(0);
    expect(october.status).not.toBe('open');
    expect(november.purchases.map((t) => t.id)).toEqual([bought.id]);
    expect(november.total).toBe(80);
    expect(november.status).toBe('open');
    expect(november.opensOn).toBe('2026-10-12');
    expect(november.closesOn).toBe('2026-11-11');
  });

  it('reads both calendar months of the cycle, so a purchase of October is found for the invoice of November', () => {
    expect(cycleMonths('2026-11', rules)).toEqual(['2026-10', '2026-11']);
  });
});
