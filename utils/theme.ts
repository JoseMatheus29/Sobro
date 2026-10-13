import { DEFAULT_THEME, THEME_PREFERENCES, type ThemePreference } from './theme-type';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as string[]).includes(value);
}

// What is stored (or comes in a backup) may be anything: an unknown value means the default.
export function themeOrDefault(value: unknown): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME;
}

// The scheme to force on the app, or null to follow the system's.
export function schemeOverride(preference: ThemePreference): 'light' | 'dark' | null {
  return preference === 'system' ? null : preference;
}
