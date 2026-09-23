import { type SQLiteDatabase } from 'expo-sqlite';

export type TransactionType = 'income' | 'expense';

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
}

export interface TransactionFilters {
  cardId?: number;
  /** 'YYYY-MM', matches transactions occurring in that month */
  month?: string;
}

const SELECT_TRANSACTIONS = `
  SELECT
    t.id, t.card_id, c.name as card_name,
    t.category_id, cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
    t.name, t.description, t.amount, t.type, t.occurred_at, t.created_at
  FROM transactions t
  JOIN cards c ON c.id = t.card_id
  JOIN categories cat ON cat.id = t.category_id
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

  const rows = await db.getAllAsync<TransactionRow>(
    `${SELECT_TRANSACTIONS} ${where} ORDER BY t.occurred_at DESC, t.id DESC`,
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
  }
): Promise<number> {
  const signedAmount = input.type === 'expense' ? -Math.abs(input.amount) : Math.abs(input.amount);
  const result = await db.runAsync(
    `INSERT INTO transactions (card_id, category_id, name, description, amount, type, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    input.cardId,
    input.categoryId,
    input.name,
    input.description ?? null,
    signedAmount,
    input.type,
    input.occurredAt
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
