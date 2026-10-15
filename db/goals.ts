import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { type ApiGoal, type ApiGoalEntry } from '@/api/types';
import { type GoalEntryRecord, type GoalRecord } from '@/utils/goals-type';

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetMonth: string | null;
  color: string;
  icon: string;
}

// What is in a caixinha (`saved`) is worked out by the server from its entries, never stored.
export function getGoals(): Promise<GoalRecord[]> {
  return api<ApiGoal[]>('GET', '/v1/goals');
}

const NOT_FOUND = 404;

// Null when it does not exist (anymore), or is not the person's.
export async function getGoalById(id: number): Promise<GoalRecord | null> {
  try {
    return await api<ApiGoal>('GET', `/v1/goals/${id}`);
  } catch (error) {
    if (isApiError(error) && error.status === NOT_FOUND) return null;
    throw error;
  }
}

// `idempotencyKey` keeps a retry after a lost answer from making two caixinhas.
export async function createGoal(input: GoalInput, idempotencyKey?: string): Promise<number> {
  const created = await api<ApiGoal>('POST', '/v1/goals', { body: input, idempotencyKey });
  return created.id;
}

export async function updateGoal(id: number, input: GoalInput): Promise<void> {
  await api('PATCH', `/v1/goals/${id}`, { body: input });
}

// The caixinha and its history go; the money was never taken out of the accounts, so nothing else changes.
export async function deleteGoal(id: number): Promise<void> {
  await api('DELETE', `/v1/goals/${id}`);
}

// Newest first. Empty for a caixinha that does not exist.
export async function getGoalEntries(goalId: number): Promise<GoalEntryRecord[]> {
  try {
    return await api<ApiGoalEntry[]>('GET', `/v1/goals/${goalId}/entries`);
  } catch (error) {
    if (isApiError(error) && error.status === NOT_FOUND) return [];
    throw error;
  }
}

// `amount` is positive to put money in and negative to take it out (the only amount of the API that is signed).
// The server refuses to take out more than is in the caixinha (409 `goal_insufficient`).
export async function addGoalEntry(
  input: { goalId: number; amount: number },
  idempotencyKey?: string
): Promise<number> {
  const created = await api<ApiGoalEntry>('POST', `/v1/goals/${input.goalId}/entries`, {
    body: { amount: input.amount },
    idempotencyKey,
  });
  return created.id;
}

// Taking back a deposit that was already partly taken out would leave the caixinha negative: 409 `goal_insufficient`.
export async function deleteGoalEntry(goalId: number, entryId: number): Promise<void> {
  try {
    await api('DELETE', `/v1/goals/${goalId}/entries/${entryId}`);
  } catch (error) {
    // Already gone (a retry of a delete that worked): that is what was asked for.
    if (!(isApiError(error) && error.status === NOT_FOUND)) throw error;
  }
}
