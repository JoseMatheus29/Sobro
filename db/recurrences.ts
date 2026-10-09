import { type SQLiteDatabase } from 'expo-sqlite';

import { dueOccurrences } from '@/utils/recurrence';
import { type RecurrenceRecord } from '@/utils/recurrence-type';

interface RecurrenceRow {
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
  day: number;
  start_month: string;
  first_installment: number;
  total: number | null;
  end_month: string | null;
  generated_until: string;
}

const SELECT_RECURRENCES = `
  SELECT
    r.id, r.card_id, c.name as card_name,
    r.category_id, cat.name as category_name, cat.icon as category_icon, cat.color as category_color,
    r.name, r.description, r.amount, r.day, r.start_month, r.first_installment,
    r.total, r.end_month, r.generated_until
  FROM recurrences r
  JOIN cards c ON c.id = r.card_id
  JOIN categories cat ON cat.id = r.category_id
`;

function mapRow(row: RecurrenceRow): RecurrenceRecord {
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
    day: row.day,
    startMonth: row.start_month,
    firstInstallment: row.first_installment,
    total: row.total,
    endMonth: row.end_month,
    generatedUntil: row.generated_until,
  };
}

export async function getRecurrences(db: SQLiteDatabase): Promise<RecurrenceRecord[]> {
  const rows = await db.getAllAsync<RecurrenceRow>(`${SELECT_RECURRENCES} ORDER BY r.id ASC`);
  return rows.map(mapRow);
}

export async function getRecurrenceById(db: SQLiteDatabase, id: number): Promise<RecurrenceRecord | null> {
  const row = await db.getFirstAsync<RecurrenceRow>(`${SELECT_RECURRENCES} WHERE r.id = ?`, id);
  return row ? mapRow(row) : null;
}

// The first occurrence is the transaction registered along with it, so generation starts the month after.
export async function createRecurrence(
  db: SQLiteDatabase,
  input: {
    cardId: number;
    categoryId: string;
    name: string;
    description?: string;
    amount: number; // unsigned magnitude
    day: number;
    startMonth: string;
    firstInstallment: number;
    total: number | null;
  }
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO recurrences
       (card_id, category_id, name, description, amount, day, start_month, first_installment, total, generated_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.cardId,
    input.categoryId,
    input.name,
    input.description ?? null,
    Math.abs(input.amount),
    input.day,
    input.startMonth,
    input.firstInstallment,
    input.total,
    input.startMonth
  );
  return result.lastInsertRowId;
}

// What changes on a recurrence applies to the occurrences still to come, not to those already made.
export async function updateRecurrence(
  db: SQLiteDatabase,
  id: number,
  patch: Partial<{ cardId: number; categoryId: string; name: string; description: string | null; amount: number }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.cardId !== undefined) { fields.push('card_id = ?'); values.push(patch.cardId); }
  if (patch.categoryId !== undefined) { fields.push('category_id = ?'); values.push(patch.categoryId); }
  if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
  if (patch.description !== undefined) { fields.push('description = ?'); values.push(patch.description); }
  if (patch.amount !== undefined) { fields.push('amount = ?'); values.push(Math.abs(patch.amount)); }
  if (fields.length === 0) return;

  values.push(id);
  await db.runAsync(`UPDATE recurrences SET ${fields.join(', ')} WHERE id = ?`, values);
}

// Ends it: nothing after what was already generated is created. What was made stays.
export async function endRecurrence(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('UPDATE recurrences SET end_month = generated_until WHERE id = ?', id);
}

// Creates the transactions of the occurrences that fell due since the app last ran. Safe to run
// any number of times: each recurrence remembers the last month it generated, so nothing is
// repeated, and a generated transaction the person deletes stays deleted.
export async function materializeDueRecurrences(db: SQLiteDatabase, now: Date = new Date()): Promise<number> {
  const recurrences = await getRecurrences(db);
  let created = 0;

  for (const r of recurrences) {
    const due = dueOccurrences(r, now);
    if (due.length === 0) continue;

    await db.withTransactionAsync(async () => {
      for (const occurrence of due) {
        await db.runAsync(
          `INSERT INTO transactions
             (card_id, category_id, name, description, amount, type, occurred_at, recurrence_id, installment)
           VALUES (?, ?, ?, ?, ?, 'expense', ?, ?, ?)`,
          r.cardId,
          r.categoryId,
          r.name,
          r.description,
          -Math.abs(r.amount),
          occurrence.date,
          r.id,
          r.total !== null ? occurrence.installment : null
        );
      }
      await db.runAsync('UPDATE recurrences SET generated_until = ? WHERE id = ?', due[due.length - 1].month, r.id);
    });
    created += due.length;
  }

  return created;
}
