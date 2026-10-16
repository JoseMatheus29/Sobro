// A backup is one JSON file with every table of the database, as it is stored (snake_case rows).
// Restoring replaces everything, so it is checked thoroughly before anything is touched.

export type BackupTableName =
  | 'categories'
  | 'cards'
  | 'recurrences'
  | 'transactions'
  | 'profile'
  | 'monthly_budgets'
  | 'category_budgets'
  | 'goals'
  | 'goal_entries';

export type BackupValue = string | number | null;
export type BackupRow = Record<string, BackupValue>;

export interface ColumnSpec {
  name: string;
  kind: 'text' | 'number' | 'integer';
  /** A column that must be in the file. The ones that are not (added in later versions) take `fallback`. */
  required: boolean;
  /** Accepts null. */
  nullable?: boolean;
  fallback?: BackupValue;
}

export interface TableSpec {
  name: BackupTableName;
  columns: ColumnSpec[];
}

export interface BackupFile {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  /** `PRAGMA user_version` of the database it came from. */
  schemaVersion: number;
  exportedAt: string;
  data: Partial<Record<BackupTableName, BackupRow[]>>;
}

/** A backup that passed the checks: every table present, every row complete. */
export interface ValidBackup {
  schemaVersion: number;
  exportedAt: string;
  data: Record<BackupTableName, BackupRow[]>;
}

export type BackupValidation = { ok: true; backup: ValidBackup } | { ok: false; reason: string };

export interface BackupSummary {
  exportedAt: string;
  transactions: number;
  cards: number;
  categories: number;
  recurrences: number;
}

export const BACKUP_APP = 'sobro';
export const BACKUP_FORMAT = 1;

const text = (name: string, extra: Partial<ColumnSpec> = {}): ColumnSpec => ({ name, kind: 'text', required: true, ...extra });
const number = (name: string, extra: Partial<ColumnSpec> = {}): ColumnSpec => ({ name, kind: 'number', required: true, ...extra });
const integer = (name: string, extra: Partial<ColumnSpec> = {}): ColumnSpec => ({ name, kind: 'integer', required: true, ...extra });

// In the order rows can be inserted: what others point to comes first.
export const BACKUP_TABLES: TableSpec[] = [
  { name: 'categories', columns: [text('id'), text('name'), text('icon'), text('color'), text('bg')] },
  {
    name: 'cards',
    columns: [
      integer('id'),
      text('name'),
      text('number'),
      text('color'),
      text('light_color'),
      number('balance', { required: false, fallback: 0 }),
      // The credit card of the account: all empty when it has none (and in the files of schema 8 or older).
      number('credit_limit', { required: false, nullable: true, fallback: null }),
      integer('closing_day', { required: false, nullable: true, fallback: null }),
      integer('due_day', { required: false, nullable: true, fallback: null }),
    ],
  },
  {
    name: 'recurrences',
    columns: [
      integer('id'),
      integer('card_id'),
      text('category_id'),
      text('name'),
      text('description', { required: false, nullable: true, fallback: null }),
      number('amount'),
      integer('day'),
      text('start_month'),
      integer('first_installment', { required: false, fallback: 1 }),
      integer('total', { required: false, nullable: true, fallback: null }),
      text('end_month', { required: false, nullable: true, fallback: null }),
      text('generated_until'),
      text('payment_method', { required: false, nullable: true, fallback: null }),
    ],
  },
  {
    name: 'transactions',
    columns: [
      integer('id'),
      integer('card_id'),
      text('category_id'),
      text('name'),
      text('description', { required: false, nullable: true, fallback: null }),
      number('amount'),
      text('type'),
      text('occurred_at'),
      text('created_at', { required: false, fallback: '' }),
      integer('recurrence_id', { required: false, nullable: true, fallback: null }),
      integer('installment', { required: false, nullable: true, fallback: null }),
      integer('transfer_id', { required: false, nullable: true, fallback: null }),
      text('payment_method', { required: false, nullable: true, fallback: null }),
      text('invoice_month', { required: false, nullable: true, fallback: null }),
    ],
  },
  {
    name: 'profile',
    columns: [
      integer('id'),
      text('name', { required: false, fallback: '' }),
      text('currency', { required: false, fallback: 'BRL' }),
      text('avatar_uri', { required: false, nullable: true, fallback: null }),
      number('monthly_budget', { required: false, nullable: true, fallback: null }),
      integer('reminders_enabled', { required: false, fallback: 1 }),
      text('theme', { required: false, fallback: 'system' }),
    ],
  },
  { name: 'monthly_budgets', columns: [text('month'), number('amount', { nullable: true })] },
  { name: 'category_budgets', columns: [text('category_id'), text('month'), number('amount', { nullable: true })] },
  {
    name: 'goals',
    columns: [
      integer('id'),
      text('name'),
      number('target_amount'),
      text('target_month', { required: false, nullable: true, fallback: null }),
      text('color'),
      text('icon'),
    ],
  },
  { name: 'goal_entries', columns: [integer('id'), integer('goal_id'), number('amount'), text('occurred_at')] },
];

export const BACKUP_FILE_PREFIX = 'sobro-backup';

// Why a file was refused.
export const BACKUP_REASONS = {
  notJson: 'O arquivo não é um backup válido (não foi possível ler o conteúdo).',
  notBackup: 'Esse arquivo não é um backup do Sobrô.',
  newerFormat: 'Esse backup foi feito por uma versão mais nova do app. Atualize o app para importá-lo.',
  newerSchema: 'Esse backup veio de uma versão mais nova do app. Atualize o app para importá-lo.',
  badTable: (table: string) => `Os dados de "${table}" estão em um formato inesperado.`,
  badRow: (table: string, index: number, column: string) => `Linha ${index + 1} de "${table}": o campo "${column}" está ausente ou inválido.`,
  badReference: (table: string, index: number, column: string) => `Linha ${index + 1} de "${table}": "${column}" aponta para algo que não existe no backup.`,
  badType: (index: number) => `Transação ${index + 1}: o tipo precisa ser "income" ou "expense".`,
  badDate: (table: string, index: number) => `Linha ${index + 1} de "${table}": a data é inválida.`,
};
