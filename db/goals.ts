import { type SQLiteDatabase } from 'expo-sqlite';

import { type GoalEntryRecord, type GoalRecord } from '@/utils/goals-type';

interface GoalRow {
  id: number;
  name: string;
  target_amount: number;
  target_month: string | null;
  color: string;
  icon: string;
  saved: number | null;
}

interface GoalEntryRow {
  id: number;
  goal_id: number;
  amount: number;
  occurred_at: string;
}

// What is in a caixinha is derived (the sum of its entries), never stored, so it can't drift from them.
const SELECT_GOALS = `
  SELECT
    goals.id, goals.name, goals.target_amount, goals.target_month, goals.color, goals.icon,
    (SELECT SUM(amount) FROM goal_entries WHERE goal_entries.goal_id = goals.id) as saved
  FROM goals
`;

function mapGoal(row: GoalRow): GoalRecord {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount,
    targetMonth: row.target_month,
    color: row.color,
    icon: row.icon,
    saved: row.saved ?? 0,
  };
}

function mapEntry(row: GoalEntryRow): GoalEntryRecord {
  return { id: row.id, goalId: row.goal_id, amount: row.amount, occurredAt: row.occurred_at };
}

export async function getGoals(db: SQLiteDatabase): Promise<GoalRecord[]> {
  const rows = await db.getAllAsync<GoalRow>(`${SELECT_GOALS} ORDER BY goals.id ASC`);
  return rows.map(mapGoal);
}

export async function getGoalById(db: SQLiteDatabase, id: number): Promise<GoalRecord | null> {
  const row = await db.getFirstAsync<GoalRow>(`${SELECT_GOALS} WHERE goals.id = ?`, id);
  return row ? mapGoal(row) : null;
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetMonth: string | null;
  color: string;
  icon: string;
}

export async function createGoal(db: SQLiteDatabase, input: GoalInput): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO goals (name, target_amount, target_month, color, icon) VALUES (?, ?, ?, ?, ?)',
    input.name,
    input.targetAmount,
    input.targetMonth,
    input.color,
    input.icon
  );
  return result.lastInsertRowId;
}

export async function updateGoal(db: SQLiteDatabase, id: number, input: GoalInput): Promise<void> {
  await db.runAsync(
    'UPDATE goals SET name = ?, target_amount = ?, target_month = ?, color = ?, icon = ? WHERE id = ?',
    input.name,
    input.targetAmount,
    input.targetMonth,
    input.color,
    input.icon,
    id
  );
}

// The caixinha and its history go; the money was never taken out of the accounts, so nothing else changes.
export async function deleteGoal(db: SQLiteDatabase, id: number): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM goal_entries WHERE goal_id = ?', id);
    await db.runAsync('DELETE FROM goals WHERE id = ?', id);
  });
}

// Newest first.
export async function getGoalEntries(db: SQLiteDatabase, goalId: number): Promise<GoalEntryRecord[]> {
  const rows = await db.getAllAsync<GoalEntryRow>(
    'SELECT id, goal_id, amount, occurred_at FROM goal_entries WHERE goal_id = ? ORDER BY occurred_at DESC, id DESC',
    goalId
  );
  return rows.map(mapEntry);
}

// `amount` is positive to put money in and negative to take it out.
export async function addGoalEntry(
  db: SQLiteDatabase,
  input: { goalId: number; amount: number; occurredAt: string }
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO goal_entries (goal_id, amount, occurred_at) VALUES (?, ?, ?)',
    input.goalId,
    input.amount,
    input.occurredAt
  );
  return result.lastInsertRowId;
}

export async function deleteGoalEntry(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM goal_entries WHERE id = ?', id);
}
