import { useEffect } from 'react';
import { Platform } from 'react-native';
import { setStyle as setNavigationBarStyle } from 'expo-navigation-bar';
import { setStatusBarStyle } from 'expo-status-bar';

import { useColors } from './useColors';

// The Android status bar and navigation bar (gestures or buttons). The app draws edge to edge: the screen goes
// under both bars, which are transparent, so there is no color to give them (the header band, the canvas and the
// tab bar are what show behind). What is left to choose is the color of their icons.
//
// - Status bar: the top of almost every screen is the header, the blue band in light and the canvas itself in dark,
//   so its icons are light in both. (A screen with a plain light top, like the one asking to update the app, shows
//   them faint for the moment it is there.)
// - Navigation bar: the tab bar (the card color) is behind its buttons, so they are dark in light and light in dark.
export function useSystemBars() {
  const colors = useColors();
  const dark = colors.scheme === 'dark';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setStatusBarStyle('light');
    setNavigationBarStyle(dark ? 'light' : 'dark');
  }, [dark]);
}
