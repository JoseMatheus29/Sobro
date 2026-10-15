import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vars } from 'nativewind';
import * as SystemUI from 'expo-system-ui';

import { colorVars, paletteFor } from '@/constants/palette';
import { useScheme } from '@/hooks/useColors';
import { useSystemBars } from '@/hooks/useSystemBars';

// Sets the CSS variables behind every color class (`bg-canvas`, `text-ink`…) for the system's light or
// dark scheme. Mount it above everything that draws, including the loading fallback.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useScheme();
  const insets = useSafeAreaInsets();
  const palette = paletteFor(scheme);
  const canvas = palette.canvas;
  const themeVars = useMemo(() => vars(colorVars(scheme)), [scheme]);

  // The status bar and the navigation bar of the phone follow the theme too.
  useSystemBars();

  // The window behind the screens (shown during transitions and under the keyboard).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(canvas).catch(() => {});
  }, [canvas]);

  // Android draws edge to edge, so what scrolls would pass under the clock and the icons of the status bar.
  // This strip, the height of the bar and on top of everything, keeps it the way it always looked: the color of
  // the canvas in dark and of the cards (white) in light, so nothing is read through the icons.
  const statusBackground = scheme === 'dark' ? palette.canvas : palette.card;

  return (
    <View style={[{ flex: 1, backgroundColor: canvas }, themeVars]}>
      {children}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: statusBackground }}
      />
    </View>
  );
}

export default ThemeProvider;
