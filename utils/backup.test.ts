import { BACKUP_APP, BACKUP_FORMAT, BACKUP_TABLES, type BackupRow } from './backup-type';
import { backupFileName, buildBackup, summarizeBackup, validateBackup } from './backup';

const NOW = new Date(2026, 9, 9, 14, 30, 0);
const SCHEMA = 5;

const tables = (): Record<string, BackupRow[]> => ({
  categories: [
    { id: 'food', name: 'Alimentação', icon: 'restaurant', color: '#E67E22', bg: 'rgba(230,126,34,0.12)' },
    { id: 'salary', name: 'Salário', icon: 'account-balance', color: '#277F2B', bg: 'rgba(39,127,43,0.12)' },
  ],
  cards: [{ id: 1, name: 'Cartão Principal', number: '0001', color: '#3161B2', light_color: '#4A74BB', balance: 100 }],
  recurrences: [
    {
      id: 1, card_id: 1, category_id: 'food', name: 'Mercado', description: null, amount: 150, day: 20,
      start_month: '2026-09', first_installment: 3, total: 10, end_month: null, generated_until: '2026-09',
    },
  ],
  transactions: [
    {
      id: 1, card_id: 1, category_id: 'food', name: 'Mercado', description: null, amount: -150, type: 'expense',
      occurred_at: '2026-09-20T12:00:00.000Z', created_at: '2026-09-20 12:00:00', recurrence_id: 1, installment: 3,
    },
    {
      id: 2, card_id: 1, category_id: 'salary', name: 'Salário', description: 'Setembro', amount: 4200, type: 'income',
      occurred_at: '2026-09-05T12:00:00.000Z', created_at: '2026-09-05 12:00:00', recurrence_id: null, installment: null,
    },
  ],
  profile: [
    { id: 1, name: 'Matheus', currency: 'BRL', avatar_uri: 'file:///cache/photo.jpg', monthly_budget: null, reminders_enabled: 1 },
  ],
  monthly_budgets: [{ month: '0000-00', amount: 2500 }],
  category_budgets: [{ category_id: 'food', month: '2026-10', amount: 1000 }],
});

const file = () => JSON.parse(JSON.stringify(buildBackup(tables(), SCHEMA, NOW)));

describe('buildBackup', () => {
  it('says what it is and when it was made', () => {
    const backup = buildBackup(tables(), SCHEMA, NOW);
    expect(backup.app).toBe(BACKUP_APP);
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.schemaVersion).toBe(5);
    expect(backup.exportedAt).toBe(NOW.toISOString());
  });

  it('has every table, even the empty ones', () => {
    const backup = buildBackup({ cards: tables().cards }, SCHEMA, NOW);
    expect(Object.keys(backup.data).sort()).toEqual(BACKUP_TABLES.map((t) => t.name).sort());
    expect(backup.data.transactions).toEqual([]);
  });

  it('writes the old avatar column as null: a path on this device means nothing elsewhere', () => {
    expect(buildBackup(tables(), SCHEMA, NOW).data.profile?.[0].avatar_uri).toBeNull();
  });
});

describe('validateBackup', () => {
  it('accepts what buildBackup made, and gives it back whole', () => {
    const result = validateBackup(file(), SCHEMA);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.transactions).toHaveLength(2);
      expect(result.backup.data.recurrences[0].total).toBe(10);
      expect(result.backup.data.profile[0].avatar_uri).toBeNull();
    }
  });

  it('survives a round trip through JSON text', () => {
    const text = JSON.stringify(buildBackup(tables(), SCHEMA, NOW));
    expect(validateBackup(JSON.parse(text), SCHEMA).ok).toBe(true);
  });

  it('refuses what is not a backup of this app', () => {
    expect(validateBackup(null, SCHEMA).ok).toBe(false);
    expect(validateBackup([], SCHEMA).ok).toBe(false);
    expect(validateBackup({ hello: 'world' }, SCHEMA).ok).toBe(false);
    expect(validateBackup({ ...file(), app: 'other' }, SCHEMA).ok).toBe(false);
  });

  it('refuses a file from a newer version, instead of guessing', () => {
    const newer = validateBackup({ ...file(), schemaVersion: 9 }, SCHEMA);
    expect(newer).toMatchObject({ ok: false });
    expect(newer.ok === false && newer.reason).toContain('mais nova');
    expect(validateBackup({ ...file(), format: 2 }, SCHEMA).ok).toBe(false);
  });

  it('accepts an older one, filling in what did not exist yet', () => {
    const old = file();
    delete old.data.recurrences;
    delete old.data.category_budgets;
    for (const t of old.data.transactions) {
      delete t.recurrence_id;
      delete t.installment;
    }
    for (const p of old.data.profile) delete p.reminders_enabled;
    old.schemaVersion = 3;
    const result = validateBackup(old, SCHEMA);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.recurrences).toEqual([]);
      expect(result.backup.data.transactions[0].recurrence_id).toBeNull();
      expect(result.backup.data.profile[0].reminders_enabled).toBe(1);
    }
  });

  it('refuses a row with a missing or wrong field, saying where', () => {
    const missing = file();
    delete missing.data.transactions[1].name;
    const a = validateBackup(missing, SCHEMA);
    expect(a.ok === false && a.reason).toContain('Linha 2 de "transactions"');
    expect(a.ok === false && a.reason).toContain('"name"');

    const wrong = file();
    wrong.data.transactions[0].amount = 'cento e cinquenta';
    expect(validateBackup(wrong, SCHEMA).ok).toBe(false);

    const notInteger = file();
    notInteger.data.cards[0].id = 1.5;
    expect(validateBackup(notInteger, SCHEMA).ok).toBe(false);
  });

  it('refuses a table that is not a list', () => {
    const broken = file();
    broken.data.cards = { id: 1 };
    expect(validateBackup(broken, SCHEMA).ok).toBe(false);
  });

  it('refuses a transaction that points to a card, category or recurrence that is not there', () => {
    const noCard = file();
    noCard.data.transactions[0].card_id = 99;
    expect(validateBackup(noCard, SCHEMA).ok).toBe(false);

    const noCategory = file();
    noCategory.data.transactions[0].category_id = 'ghost';
    expect(validateBackup(noCategory, SCHEMA).ok).toBe(false);

    const noRecurrence = file();
    noRecurrence.data.transactions[0].recurrence_id = 42;
    expect(validateBackup(noRecurrence, SCHEMA).ok).toBe(false);

    const limit = file();
    limit.data.category_budgets[0].category_id = 'ghost';
    expect(validateBackup(limit, SCHEMA).ok).toBe(false);
  });

  it('refuses a transaction with an unknown type or an impossible date', () => {
    const type = file();
    type.data.transactions[0].type = 'transfer';
    expect(validateBackup(type, SCHEMA).ok).toBe(false);

    const date = file();
    date.data.transactions[0].occurred_at = 'ontem';
    expect(validateBackup(date, SCHEMA).ok).toBe(false);
  });

  it('accepts a backup with no transactions at all', () => {
    const empty = file();
    empty.data.transactions = [];
    empty.data.recurrences = [];
    expect(validateBackup(empty, SCHEMA).ok).toBe(true);
  });

  it('drops columns it does not know instead of passing them to the database', () => {
    const extra = file();
    extra.data.cards[0].surprise = 'DROP TABLE cards';
    const result = validateBackup(extra, SCHEMA);
    expect(result.ok && 'surprise' in result.backup.data.cards[0]).toBe(false);
  });
});

describe('summarizeBackup', () => {
  it('counts what is in it', () => {
    const result = validateBackup(file(), SCHEMA);
    if (!result.ok) throw new Error('should be valid');
    expect(summarizeBackup(result.backup)).toEqual({
      exportedAt: NOW.toISOString(),
      transactions: 2,
      cards: 1,
      categories: 2,
      recurrences: 1,
    });
  });
});

describe('backupFileName', () => {
  it('carries the date', () => {
    expect(backupFileName(NOW, 'sobro-backup')).toBe('sobro-backup-2026-10-09.json');
    expect(backupFileName(new Date(2027, 0, 3), 'x')).toBe('x-2027-01-03.json');
  });
});
