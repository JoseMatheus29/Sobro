import { queryClient } from '@/api/queryClient';

// Called after something was saved, edited or deleted (or changed without a screen doing it): every cached read is
// marked old and the ones on screen are read again. Whatever is behind another screen reads when it comes back
// (see db/query.ts). Resolves once what is on screen has been read again, for a caller that wants to show the new
// state before it goes on.
export function notifyDataChanged(): Promise<void> {
  return queryClient.invalidateQueries();
}

// After the account's data was replaced as a whole (a restored backup): the ids are others, so nothing that was read
// is any good. Everything is thrown away and what is on screen is read again.
export function resetAllData(): Promise<void> {
  return queryClient.resetQueries();
}
