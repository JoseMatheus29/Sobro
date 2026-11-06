import { type CardRecord } from '@/db/cards';
import { type TransactionRecord } from '@/db/transactions';
import { buildInvoiceReminders } from './reminders';
import { type RecurrenceRecord } from './recurrence-type';

// Closes on the 3rd, falls due on the 10th. Monday, 9 November 2026, 08:00: the invoice of November (the purchases of
// 4 Oct to 3 Nov) falls due tomorrow, and the one taking purchases now is the one that closes on 3 December.
const NOW = new Date(2026, 10, 9, 8, 0, 0);

const CARD: CardRecord = {
  id: 1,
  name: 'Nubank',
  number: '1234',
  color: '#8A05BE',
  lightColor: '#A33BD0',
  balance: 1000,
  credit: { limit: 3000, closingDay: 3, dueDay: 10 },
};

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
  purchase('2026-11-05', amount, { categoryId: 'invoice', paymentMethod: null, invoiceMonth: month });

const run = (
  purchases: TransactionRecord[],
  payments: TransactionRecord[] = [],
  options: { now?: Date; cards?: CardRecord[]; recurrences?: RecurrenceRecord[] } = {}
) =>
  buildInvoiceReminders(
    options.cards ?? [CARD],
    { 1: { purchases, payments } },
    options.recurrences ?? [],
    options.now ?? NOW
  );

describe('buildInvoiceReminders', () => {
  it('goes off the morning before the due day, with what is left to pay', () => {
    const [first] = run([purchase('2026-10-20', 500), purchase('2026-10-25', 250.5)]);
    expect(first.key).toBe('invoice-1-2026-11');
    expect(first.fireAt).toEqual(new Date(2026, 10, 9, 9, 0, 0));
    expect(first.title).toBe('Fatura do Nubank vence amanhã');
    expect(first.body).toBe('Fatura de novembro · R$ 750,50');
  });

  it('reminds only of what is still owed after a partial payment', () => {
    const [first] = run([purchase('2026-10-20', 500)], [payment('2026-11', 200)]);
    expect(first.body).toBe('Fatura de novembro · R$ 300,00');
  });

  it('has none for an invoice that was paid, or that has nothing in it', () => {
    expect(run([purchase('2026-10-20', 500)], [payment('2026-11', 500)])).toEqual([]);
    expect(run([])).toEqual([]);
  });

  it('also reminds of the invoice that is still taking purchases when it falls due within the window', () => {
    // 20 Nov goes into the invoice that closes on 3 Dec and falls due on 10 Dec
    const reminders = run([purchase('2026-10-20', 500), purchase('2026-11-20', 80)]);
    expect(reminders.map((r) => r.key)).toEqual(['invoice-1-2026-11', 'invoice-1-2026-12']);
    expect(reminders[1].fireAt).toEqual(new Date(2026, 11, 9, 9, 0, 0));
    expect(reminders[1].body).toBe('Fatura de dezembro · R$ 80,00');
  });

  it('skips a reminder whose time already passed', () => {
    const late = new Date(2026, 10, 9, 10, 0, 0);
    expect(run([purchase('2026-10-20', 500)], [], { now: late })).toEqual([]);
  });

  it('leaves out the invoices that fall due beyond the window', () => {
    // 10 Jan is about two months away
    const reminders = run([purchase('2026-12-20', 80)]);
    expect(reminders).toEqual([]);
  });

  it('counts the installments that the recurring expenses on credit will put in the invoice', () => {
    const plan: RecurrenceRecord = {
      id: 7,
      cardId: 1,
      cardName: 'Nubank',
      categoryId: 'shopping',
      categoryName: 'Compras',
      categoryIcon: 'shopping-bag',
      categoryColor: '#9B59B6',
      name: 'Notebook',
      description: null,
      amount: 400,
      day: 20,
      startMonth: '2026-10',
      firstInstallment: 1,
      total: 5,
      endMonth: null,
      generatedUntil: '2026-10',
      paymentMethod: 'credit',
    };
    // the 1st installment (20 Oct) is bought; the 2nd (20 Nov) goes into the invoice of December
    const reminders = run([purchase('2026-10-20', 400)], [], { recurrences: [plan] });
    expect(reminders.map((r) => r.body)).toEqual(['Fatura de novembro · R$ 400,00', 'Fatura de dezembro · R$ 400,00']);
  });

  it('has none for an account without a credit card, or without its history', () => {
    expect(run([purchase('2026-10-20', 500)], [], { cards: [{ ...CARD, credit: null }] })).toEqual([]);
    expect(buildInvoiceReminders([CARD], {}, [], NOW)).toEqual([]);
  });
});
