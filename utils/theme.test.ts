import { isThemePreference, schemeOverride, themeOrDefault } from './theme';

describe('theme preference', () => {
  it('knows the three choices', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('auto')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
    expect(isThemePreference(1)).toBe(false);
  });

  it('falls back to following the system for anything else', () => {
    expect(themeOrDefault('dark')).toBe('dark');
    expect(themeOrDefault('blue')).toBe('system');
    expect(themeOrDefault(undefined)).toBe('system');
  });

  it('forces a scheme only when one was chosen', () => {
    expect(schemeOverride('system')).toBeNull();
    expect(schemeOverride('light')).toBe('light');
    expect(schemeOverride('dark')).toBe('dark');
  });
});
