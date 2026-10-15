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
