// How the person wants the app drawn: following the phone's setting, or always light, or always dark.
export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: ThemePreference[] = ['system', 'light', 'dark'];
export const DEFAULT_THEME: ThemePreference = 'system';
// Where the choice is kept on the phone (AsyncStorage).
export const THEME_STORAGE_KEY = 'theme';
