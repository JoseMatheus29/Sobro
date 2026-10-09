import { type SQLiteDatabase } from 'expo-sqlite';

import { type MonthTotals } from '@/utils/history-type';

export type TransactionType = 'income' | 'expense';

// Set on the transactions that come from a recurring expense (see utils/recurrence.ts).
export interface TransactionRecurrence {
  id: number;
  /** Number of this payment in its plan; null for a plain monthly one. */
  installment: number | null;
  /** Payments in the plan; null for a plain monthly one. */
  total: number | null;
}

export interface TransactionRecord {
  id: number;
  cardId: number;
  cardName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  name: string;
  description: string | null;
  amount: number; // always signed: negative = expense, positive = income
  type: TransactionType;
  occurredAt: string; // ISO 8601
  createdAt: string;
  recurrence?: TransactionRecurrence | null;
  /** True for a calculated row of a month that has not started: it is not in the database. */
  planned?: boolean;
  /** Shared by the two legs of a transfer between accounts; null for an ordinary transaction. */
  transferId?: number | null;
}

interface TransactionRow {
  id: number;
  card_id: number;
  card_name: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  name: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  occurred_at: string;
  created_at: string;
  recurrence_id: number | null;
  installment: number | null;
  recurrence_total: number | null;
  transfer_id: number | null;
}

export interface TransactionFilters {
  cardId?: number;
  /** 'YYYY-MM', matches transactions occurring in that month */
  month?: string;
  /** Newest first, so this keeps the most recent N. */
  limit?: number;
}

const SELECT_TRANSACTIONS = `
  SELECT
    t.id, t.card_id, c.name as card_name,
    t.category_id, cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
    t.name, t.description, t.amount, t.type, t.occurred_at, t.created_at,
    t.recurrence_id, t.installment, rec.total as recurrence_total, t.transfer_id
  FROM transactions t
  JOIN cards c ON c.id = t.card_id
  JOIN categories cat ON cat.id = t.category_id
  LEFT JOIN recurrences rec ON rec.id = t.recurrence_id
`;

function mapRow(row: TransactionRow): TransactionRecord {
  return {
    id: row.id,
    cardId: row.card_id,
    cardName: row.card_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    name: row.name,
    description: row.description,
    amount: row.amount,
    type: row.type,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
    recurrence:
      row.recurrence_id !== null
        ? { id: row.recurrence_id, installment: row.installment, total: row.recurrence_total }
        : null,
    transferId: row.transfer_id,
  };
}

export async function getTransactions(
  db: SQLiteDatabase,
  filters: TransactionFilters = {}
): Promise<TransactionRecord[]> {
  const conditions: string[] = [];
  const params: (string | number)[] = [];
  if (filters.cardId !== undefined) {
    conditions.push('t.card_id = ?');
    params.push(filters.cardId);
  }
  if (filters.month) {
    conditions.push('t.occurred_at LIKE ?');
    params.push(`${filters.month}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters.limit !== undefined ? ` LIMIT ${Math.max(0, Math.floor(filters.limit))}` : '';

  const rows = await db.getAllAsync<TransactionRow>(
    `${SELECT_TRANSACTIONS} ${where} ORDER BY t.occurred_at DESC, t.id DESC${limit}`,
    params
  );
  return rows.map(mapRow);
}

export async function getTransactionById(db: SQLiteDatabase, id: number): Promise<TransactionRecord | null> {
  const row = await db.getFirstAsync<TransactionRow>(`${SELECT_TRANSACTIONS} WHERE t.id = ?`, id);
  return row ? mapRow(row) : null;
}

export async function createTransaction(
  db: SQLiteDatabase,
  input: {
    cardId: number;
    categoryId: string;
    name: string;
    description?: string;
    amount: number; // unsigned magnitude; sign is derived from `type` here
    type: TransactionType;
    occurredAt: string;
    /** Set when this is the first occurrence of a recurring expense. */
    recurrenceId?: number;
    installment?: number;
  }
): Promise<number> {
  const signedAmount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  const result = await db.runAsync(
    `INSERT INTO transactions (card_id, category_id, name, description, amount, type, occurred_at, recurrence_id, installment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.cardId,
    input.categoryId,
    input.name,
    input.description ?? null,
    signedAmount,
    input.type,
    input.occurredAt,
    input.recurrenceId ?? null,
    input.installment ?? null
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(
  db: SQLiteDatabase,
  id: number,
  patch: Partial<{
    cardId: number;
    categoryId: string;
    name: string;
    description: string | null;
    amount: number; // unsigned magnitude; sign is re-derived from `type` (existing or patched)
    type: TransactionType;
    occurredAt: string;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  let type = patch.type;
  if (patch.amount !== undefined && type === undefined) {
    const current = await db.getFirstAsync<{ type: TransactionType }>(
      'SELECT type FROM transactions WHERE id = ?',
      id
    );
    type = current?.type;
  }

  if (patch.cardId !== undefined) { fields.push('card_id = ?'); values.push(patch.cardId); }
  if (patch.categoryId !== undefined) { fields.push('category_id = ?'); values.push(patch.categoryId); }
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.description !== undefined) { fields.push('description = ?'); values.push(patch.description); }
  if (patch.amount !== undefined && type !== undefined) {
    fields.push('amount = ?');
    values.push(type === 'expense' ? -Math.abs(patch.amount) : Math.abs(patch.amount));
  }
  if (patch.type !== undefined) { fields.push('type = ?'); values.push(patch.type); }
  if (patch.occurredAt !== undefined) { fields.push('occurred_at = ?'); values.push(patch.occurredAt); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteTransaction(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE id = ?', id);
}

export const TRANSFER_CATEGORY_ID = 'transfer';

// Moves money from one account to another: an expense in the first and an income in the second, tied
// by `transfer_id`. Both change the balances, but neither counts as the month's income or expense.
export async function createTransfer(
  db: SQLiteDatabase,
  input: {
    fromCardId: number;
    fromName: string;
    toCardId: number;
    toName: string;
    amount: number; // unsigned magnitude
    description?: string;
    occurredAt: string;
  }
): Promise<void> {
  const amount = Math.abs(input.amount);
  await db.withTransactionAsync(async () => {
    const out = await db.runAsync(
      `INSERT INTO transactions (card_id, category_id, name, description, amount, type, occurred_at)
       VALUES (?, ?, ?, ?, ?, 'expense', ?)`,
      input.fromCardId,
      TRANSFER_CATEGORY_ID,
      `Para ${input.toName}`,
      input.description ?? null,
      -amount,
      input.occurredAt
    );
    // The first leg's id names the transfer.
    const transferId = out.lastInsertRowId;
    await db.runAsync('UPDATE transactions SET transfer_id = ? WHERE id = ?', transferId, transferId);
    await db.runAsync(
      `INSERT INTO transactions (card_id, category_id, name, description, amount, type, occurred_at, transfer_id)
       VALUES (?, ?, ?, ?, ?, 'income', ?, ?)`,
      input.toCardId,
      TRANSFER_CATEGORY_ID,
      `De ${input.fromName}`,
      input.description ?? null,
      amount,
      input.occurredAt,
      transferId
    );
  });
}

// Both legs of a transfer, the one that left first.
export async function getTransferLegs(db: SQLiteDatabase, transferId: number): Promise<TransactionRecord[]> {
  const rows = await db.getAllAsync<TransactionRow>(
    `${SELECT_TRANSACTIONS} WHERE t.transfer_id = ? ORDER BY t.type DESC, t.id ASC`,
    transferId
  );
  return rows.map(mapRow);
}

// Deleting a transfer takes away both legs, or the balances would be left wrong.
export async function deleteTransfer(db: SQLiteDatabase, transferId: number): Promise<void> {
  await db.runAsync('DELETE FROM transactions WHERE transfer_id = ?', transferId);
}

// What each month with transactions took in and put out, for the history. Transfers between
// accounts are neither.
export async function getMonthlyTotals(db: SQLiteDatabase): Promise<MonthTotals[]> {
  const rows = await db.getAllAsync<{ month: string; income: number; expense: number }>(
    `SELECT substr(occurred_at, 1, 7) AS month,
            SUM(CASE WHEN type = 'income' THEN ABS(amount) ELSE 0 END) AS income,
            SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END) AS expense
     FROM transactions
     WHERE transfer_id IS NULL
     GROUP BY month
     ORDER BY month DESC`
  );
  return rows;
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  bg: string;
  total: number; // positive magnitude of expenses
}

export async function getCategoryTotals(
  db: SQLiteDatabase,
  filters: { month?: string } = {}
): Promise<CategoryTotal[]> {
  const conditions = ["t.type = 'expense'", 't.transfer_id IS NULL'];
  const params: string[] = [];
  if (filters.month) {
    conditions.push('t.occurred_at LIKE ?');
    params.push(`${filters.month}%`);
  }

  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    icon: string;
    color: string;
    bg: string;
    total: number;
  }>(
    `SELECT t.category_id, cat.name as category_name, cat.icon, cat.color, cat.bg,
            SUM(ABS(t.amount)) as total
     FROM transactions t
     JOIN categories cat ON cat.id = t.category_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY t.category_id
     ORDER BY total DESC`,
    params
  );

  return rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    icon: r.icon,
    color: r.color,
    bg: r.bg,
    total: r.total,
  }));
}
