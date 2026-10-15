import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setStyle as setNavigationBarStyle } from 'expo-navigation-bar';
import { setStatusBarStyle } from 'expo-status-bar';

import { useColors } from './useColors';

// The Android status bar and navigation bar (gestures or buttons). The app draws edge to edge: the screen goes
// under both bars, which are transparent, so there is no color to give them. What is left to choose is the color
// of their icons, set against what is behind each:
//
// - Status bar: ThemeProvider paints a strip under it, the canvas in dark and white in light, so its icons are
//   light in dark and dark in light.
// - Navigation bar: the tab bar (the card color) is behind its buttons, so they are dark in light and light in dark.
export function useSystemBars() {
  const colors = useColors();
  const dark = colors.scheme === 'dark';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setStatusBarStyle(dark ? 'light' : 'dark');
    setNavigationBarStyle(dark ? 'light' : 'dark');
  }, [dark]);
}
