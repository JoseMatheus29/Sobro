import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';

import { useColors } from './useColors';

// `expo-navigation-bar` is a native module: a build made before it was added does not have it, and
// importing it there throws. Asking for it when needed keeps that build working (only the bar stays as is).
function loadNavigationBar(): typeof import('expo-navigation-bar') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-navigation-bar');
  } catch {
    return null;
  }
}

// The Android status bar and navigation bar (gestures or buttons) follow the theme: the native theme
// paints both white, which on the dark theme is a white strip above and below the app. The status bar takes
// the color of the canvas in dark (the header there is the canvas itself) and white in light, and the
// navigation bar the color of the tab bar, so the two read as one piece.
export function useSystemBars() {
  const colors = useColors();
  const dark = colors.scheme === 'dark';
  const statusBackground = dark ? colors.canvas : colors.card;
  const navigationBackground = colors.card;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    StatusBar.setBarStyle(dark ? 'light-content' : 'dark-content', true);
    StatusBar.setBackgroundColor(statusBackground, true);

    const navigationBar = loadNavigationBar();
    if (!navigationBar) return;
    navigationBar.setBackgroundColorAsync(navigationBackground).catch(() => {});
    navigationBar.setButtonStyleAsync(dark ? 'light' : 'dark').catch(() => {});
  }, [dark, statusBackground, navigationBackground]);
}
