import AsyncStorage from '@react-native-async-storage/async-storage';

import { themeOrDefault } from '@/utils/theme';
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemePreference } from '@/utils/theme-type';

// The light/dark choice lives on the phone only: it has to apply before anyone has logged in, so the login screens
// are drawn the way the person wants. It is a look, not account data, and the API does not have it.

export async function getStoredTheme(): Promise<ThemePreference> {
  try {
    return themeOrDefault(await AsyncStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export async function setStoredTheme(theme: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The choice still applies until the app closes.
  }
}
