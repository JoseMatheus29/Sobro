import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { type ApiRecurrence } from '@/api/types';
import { type RecurrenceRecord } from '@/utils/recurrence-type';

// The recurring expenses. They are made with the first transaction (`repeat` in createTransaction), changed with
// `applyToNext` in updateTransaction, and the server turns the ones that fell due into transactions whenever it
// reads: the app only reads them, to show what is planned and to set the reminders.

export function getRecurrences(): Promise<RecurrenceRecord[]> {
  return api<ApiRecurrence[]>('GET', '/v1/recurrences');
}

// The person's own, whatever profile is open: the reminders are always about their own expenses.
export function getOwnRecurrences(): Promise<RecurrenceRecord[]> {
  return api<ApiRecurrence[]>('GET', '/v1/recurrences', { profileId: null });
}

// Null when it does not exist (anymore), or is not the person's.
export async function getRecurrenceById(id: number): Promise<RecurrenceRecord | null> {
  try {
    return await api<ApiRecurrence>('GET', `/v1/recurrences/${id}`);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
}

// Ends it: nothing after what was already generated is created. What was made stays.
export function endRecurrence(id: number): Promise<RecurrenceRecord> {
  return api<ApiRecurrence>('POST', `/v1/recurrences/${id}/end`);
}

const NOT_FOUND = 404;

// Deletes it and every transaction it made, of every month (the one entered by hand and the generated ones): the way
// out for a recurrence made by mistake, since ending it leaves what was made and deleting a transaction takes only that
// one. A repeated delete answers 404, which counts as done (see docs/api-excluir-recorrencia.md).
export async function deleteRecurrence(id: number): Promise<void> {
  try {
    await api('DELETE', `/v1/recurrences/${id}`);
  } catch (error) {
    if (!(isApiError(error) && error.status === NOT_FOUND)) throw error;
  }
}
