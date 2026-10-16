import AsyncStorage from '@react-native-async-storage/async-storage';

import { tutorialStorageKey } from '@/utils/tutorial';

// Whether the first-run tutorial was seen lives on the phone, one flag for each account. It is not account data (the
// API does not have it) and it holds nothing financial.

export async function hasSeenTutorial(userId: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(tutorialStorageKey(userId))) === '1';
  } catch {
    // Better to show it again than to hide it for good.
    return false;
  }
}

export async function markTutorialSeen(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(tutorialStorageKey(userId), '1');
  } catch {
    // It may show again the next time; nothing is lost.
  }
}

// "Rever tutorial": the next time the Home opens it starts again.
export async function resetTutorial(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(tutorialStorageKey(userId));
  } catch {
    // Nothing to undo.
  }
}
