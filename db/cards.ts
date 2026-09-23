import { type SQLiteDatabase } from 'expo-sqlite';

export interface CardRecord {
  id: number;
  name: string;
  number: string;
  color: string;
  lightColor: string;
  balance: number;
}

interface CardRow {
  id: number;
  name: string;
  number: string;
  color: string;
  light_color: string;
  starting_balance: number;
  transactions_total: number | null;
}

// balance is derived (starting balance + sum of its transactions), never stored/updated
// directly, so it can't drift out of sync with the transactions table.
const SELECT_CARDS = `
  SELECT
    cards.id, cards.name, cards.number, cards.color, cards.light_color,
    cards.balance as starting_balance,
    (SELECT SUM(amount) FROM transactions WHERE transactions.card_id = cards.id) as transactions_total
  FROM cards
`;

function mapRow(row: CardRow): CardRecord {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    color: row.color,
    lightColor: row.light_color,
    balance: row.starting_balance + (row.transactions_total ?? 0),
  };
}

export async function getCards(db: SQLiteDatabase): Promise<CardRecord[]> {
  const rows = await db.getAllAsync<CardRow>(`${SELECT_CARDS} ORDER BY cards.id ASC`);
  return rows.map(mapRow);
}

export async function getCardById(db: SQLiteDatabase, id: number): Promise<CardRecord | null> {
  const row = await db.getFirstAsync<CardRow>(`${SELECT_CARDS} WHERE cards.id = ?`, id);
  return row ? mapRow(row) : null;
}

export async function createCard(
  db: SQLiteDatabase,
  input: { name: string; number: string; color: string; lightColor: string; startingBalance?: number }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO cards (name, number, color, light_color, balance) VALUES (?, ?, ?, ?, ?)',
    input.name,
    input.number,
    input.color,
    input.lightColor,
    input.startingBalance ?? 0
  );
  return result.lastInsertRowId;
}

export async function updateCard(
  db: SQLiteDatabase,
  id: number,
  patch: Partial<{ name: string; number: string; color: string; lightColor: string }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number)[] = [];
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.number !== undefined) { fields.push('number = ?'); values.push(patch.number); }
  if (patch.color !== undefined) { fields.push('color = ?'); values.push(patch.color); }
  if (patch.lightColor !== undefined) { fields.push('light_color = ?'); values.push(patch.lightColor); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE cards SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteCard(db: SQLiteDatabase, id: number): Promise<void> {
  // no FK cascade in SQLite by default: drop this card's transactions first to avoid orphans
  await db.runAsync('DELETE FROM transactions WHERE card_id = ?', id);
  await db.runAsync('DELETE FROM cards WHERE id = ?', id);
}
