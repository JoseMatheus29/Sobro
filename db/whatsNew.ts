import AsyncStorage from '@react-native-async-storage/async-storage';

import { whatsNewStorageKey } from '@/utils/whatsNew';

// The last "what's new" an account has seen lives on the phone, one for each account. Like the tutorial flag it is not
// account data (the API does not have it) and it holds nothing financial: only the id of a release.

export async function getSeenRelease(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(whatsNewStorageKey(userId));
  } catch {
    // Better to show the news again than to hide it for good.
    return null;
  }
}

export async function markReleaseSeen(userId: string, releaseId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(whatsNewStorageKey(userId), releaseId);
  } catch {
    // It may show again the next time; nothing is lost.
  }
}
