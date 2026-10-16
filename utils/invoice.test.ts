import { type TransactionRecord } from '@/db/transactions';
import {
  buildInvoice,
  closesOn,
  cycleMonths,
  daysBetween,
  dueOn,
  invoiceMonthOf,
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

  it('counts apart from the total of the invoice', () => {
    const planned = plannedPurchases([recurrence], '2026-12', RULES, 1);
    const invoice = buildInvoice({
      month: '2026-12',
      rules: RULES,
      purchases: [],
      payments: [],
      planned,
      today: '2026-10-16',
    });
    expect(invoice.total).toBe(0);
    expect(invoice.plannedTotal).toBe(150);
    expect(invoice.purchases).toHaveLength(1);
  });
});

describe('days', () => {
  it('reads the phone calendar and counts days', () => {
    expect(todayKey(new Date(2026, 9, 16, 22, 30))).toBe('2026-10-16');
    expect(daysBetween('2026-10-16', '2026-11-03')).toBe(18);
    expect(daysBetween('2026-11-10', '2026-11-03')).toBe(-7);
  });
});
