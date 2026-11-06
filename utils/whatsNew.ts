import { WHATS_NEW_STORAGE_PREFIX, type Release } from '@/types/whatsNew/whatsNew-type';

export const whatsNewStorageKey = (userId: string) => `${WHATS_NEW_STORAGE_PREFIX}${userId}`;

// The releases an account has not seen, newest first. `releases` is newest first; `seenId` is the last one the account
// saw. Never seen anything, or an id that is not in the list (it was removed), gets only the newest: there is no way
// to tell what they missed, and a wall of old news would not help.
export function unseenReleases(releases: Release[], seenId: string | null): Release[] {
  if (releases.length === 0) return [];
  if (seenId === null) return [releases[0]];
  const index = releases.findIndex((release) => release.id === seenId);
  return index === -1 ? [releases[0]] : releases.slice(0, index);
}
