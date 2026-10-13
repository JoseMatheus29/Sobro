import {
  BACKUP_APP,
  BACKUP_FORMAT,
  BACKUP_REASONS,
  BACKUP_TABLES,
  type BackupFile,
  type BackupRow,
  type BackupSummary,
  type BackupTableName,
  type BackupValidation,
  type BackupValue,
  type ColumnSpec,
  type ValidBackup,
} from './backup-type';

// The file to save, from the rows read out of the database. `avatar_uri` is a column left from a
// photo feature that was removed; whatever is still in it is a path on this device, so it is not carried.
export function buildBackup(
  tables: Partial<Record<BackupTableName, BackupRow[]>>,
  schemaVersion: number,
  now: Date
): BackupFile {
  const data: BackupFile['data'] = {};
  for (const spec of BACKUP_TABLES) {
    const rows = tables[spec.name] ?? [];
    data[spec.name] = spec.name === 'profile' ? rows.map((row) => ({ ...row, avatar_uri: null })) : rows;
  }
  return { app: BACKUP_APP, format: BACKUP_FORMAT, schemaVersion, exportedAt: now.toISOString(), data };
}

function isRow(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fits(column: ColumnSpec, value: unknown): value is BackupValue {
  if (value === null) return column.nullable === true;
  if (column.kind === 'text') return typeof value === 'string';
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;
  return column.kind === 'integer' ? Number.isInteger(value) : true;
}

// Checks a file read from outside before anything is replaced: who made it, which version, that every
// row is complete and that everything that points to something points to something in the file.
// What it returns has every table, only the known columns, and the missing optional ones filled in.
export function validateBackup(raw: unknown, currentSchemaVersion: number): BackupValidation {
  if (!isRow(raw) || raw.app !== BACKUP_APP || !isRow(raw.data)) {
    return { ok: false, reason: BACKUP_REASONS.notBackup };
  }
  if (typeof raw.format !== 'number' || raw.format > BACKUP_FORMAT) {
    return { ok: false, reason: BACKUP_REASONS.newerFormat };
  }
  if (typeof raw.schemaVersion !== 'number' || !Number.isInteger(raw.schemaVersion) || raw.schemaVersion < 1) {
    return { ok: false, reason: BACKUP_REASONS.notBackup };
  }
  if (raw.schemaVersion > currentSchemaVersion) {
    return { ok: false, reason: BACKUP_REASONS.newerSchema };
  }

  const data = {} as Record<BackupTableName, BackupRow[]>;
  for (const spec of BACKUP_TABLES) {
    const source = raw.data[spec.name];
    if (source === undefined) {
      data[spec.name] = [];
      continue;
    }
    if (!Array.isArray(source)) return { ok: false, reason: BACKUP_REASONS.badTable(spec.name) };

    const rows: BackupRow[] = [];
    for (let i = 0; i < source.length; i++) {
      const row = source[i];
      if (!isRow(row)) return { ok: false, reason: BACKUP_REASONS.badTable(spec.name) };

      const clean: BackupRow = {};
      for (const column of spec.columns) {
        const value = row[column.name];
        if (value === undefined) {
          if (column.required) return { ok: false, reason: BACKUP_REASONS.badRow(spec.name, i, column.name) };
          clean[column.name] = column.fallback ?? null;
        } else if (!fits(column, value)) {
          return { ok: false, reason: BACKUP_REASONS.badRow(spec.name, i, column.name) };
        } else {
          clean[column.name] = value;
        }
      }
      rows.push(clean);
    }
    data[spec.name] = rows;
  }

  const categories = new Set(data.categories.map((r) => r.id));
  const cards = new Set(data.cards.map((r) => r.id));
  const recurrences = new Set(data.recurrences.map((r) => r.id));
  const goals = new Set(data.goals.map((r) => r.id));

  const pointers: [BackupTableName, string, Set<BackupValue>][] = [
    ['recurrences', 'card_id', cards],
    ['recurrences', 'category_id', categories],
    ['transactions', 'card_id', cards],
    ['transactions', 'category_id', categories],
    ['category_budgets', 'category_id', categories],
    ['goal_entries', 'goal_id', goals],
  ];
  for (const [table, column, targets] of pointers) {
    const index = data[table].findIndex((row) => !targets.has(row[column]));
    if (index >= 0) return { ok: false, reason: BACKUP_REASONS.badReference(table, index, column) };
  }
  const orphan = data.transactions.findIndex((r) => r.recurrence_id !== null && !recurrences.has(r.recurrence_id));
  if (orphan >= 0) return { ok: false, reason: BACKUP_REASONS.badReference('transactions', orphan, 'recurrence_id') };

  const badType = data.transactions.findIndex((r) => r.type !== 'income' && r.type !== 'expense');
  if (badType >= 0) return { ok: false, reason: BACKUP_REASONS.badType(badType) };

  for (const table of ['transactions', 'goal_entries'] as const) {
    const badDate = data[table].findIndex((r) => Number.isNaN(Date.parse(String(r.occurred_at))));
    if (badDate >= 0) return { ok: false, reason: BACKUP_REASONS.badDate(table, badDate) };
  }

  const exportedAt = typeof raw.exportedAt === 'string' ? raw.exportedAt : '';
  const backup: ValidBackup = { schemaVersion: raw.schemaVersion, exportedAt, data };
  return { ok: true, backup };
}

export function summarizeBackup(backup: ValidBackup): BackupSummary {
  return {
    exportedAt: backup.exportedAt,
    transactions: backup.data.transactions.length,
    cards: backup.data.cards.length,
    categories: backup.data.categories.length,
    recurrences: backup.data.recurrences.length,
  };
}

// "sobro-backup-2026-10-09.json", with the date as the person sees it.
export function backupFileName(now: Date, prefix: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}
