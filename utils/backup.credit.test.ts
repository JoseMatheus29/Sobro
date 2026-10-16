import { BACKUP_APP, BACKUP_FORMAT } from './backup-type';
import { validateBackup } from './backup';

// The credit card of an account and how each expense was paid came with schema 9: older files have none of it.
const base = (schemaVersion: number, cards: object[], transactions: object[], recurrences: object[] = []) => ({
  app: BACKUP_APP,
  format: BACKUP_FORMAT,
  schemaVersion,
  exportedAt: '2026-10-16T12:00:00.000Z',
  data: {
    categories: [{ id: 'food', name: 'Alimentação', icon: 'restaurant', color: '#E67E22', bg: 'rgba(230,126,34,0.12)' }],
    cards,
    recurrences,
    transactions,
  },
});

const oldCard = { id: 1, name: 'Nubank', number: '0001', color: '#3161B2', light_color: '#4A74BB', balance: 100 };
const oldTransaction = {
  id: 1, card_id: 1, category_id: 'food', name: 'Mercado', amount: -50, type: 'expense',
  occurred_at: '2026-09-20T12:00:00.000Z', created_at: '2026-09-20T12:00:00.000Z',
};

describe('a backup with credit cards', () => {
  it('takes a file from before the cards, with every new column empty', () => {
    const result = validateBackup(base(8, [oldCard], [oldTransaction]), 9);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data.cards[0]).toMatchObject({ credit_limit: null, closing_day: null, due_day: null });
    expect(result.backup.data.transactions[0]).toMatchObject({ payment_method: null, invoice_month: null });
  });

  it('keeps the card of an account, how an expense was paid and the invoice a payment paid', () => {
    const card = { ...oldCard, credit_limit: 6000, closing_day: 3, due_day: 10 };
    const purchase = { ...oldTransaction, id: 2, payment_method: 'credit' };
    const payment = { ...oldTransaction, id: 3, payment_method: null, invoice_month: '2026-10' };
    const result = validateBackup(base(9, [card], [purchase, payment]), 9);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.backup.data.cards[0]).toMatchObject({ credit_limit: 6000, closing_day: 3, due_day: 10 });
    expect(result.backup.data.transactions.map((t) => t.payment_method)).toEqual(['credit', null]);
    expect(result.backup.data.transactions[1].invoice_month).toBe('2026-10');
  });

  it('refuses a card day that is not a whole number', () => {
    const result = validateBackup(base(9, [{ ...oldCard, closing_day: 'três', due_day: 10 }], []), 9);
    expect(result.ok).toBe(false);
  });

  it('refuses a file newer than what the app knows', () => {
    expect(validateBackup(base(10, [oldCard], []), 9).ok).toBe(false);
  });
});
