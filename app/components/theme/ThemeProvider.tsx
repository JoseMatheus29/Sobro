import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { vars } from 'nativewind';
import * as SystemUI from 'expo-system-ui';

import { colorVars, paletteFor } from '@/constants/palette';
import { useScheme } from '@/hooks/useColors';

// Sets the CSS variables behind every color class (`bg-canvas`, `text-ink`…) for the system's light or
// dark scheme. Mount it above everything that draws, including the loading fallback.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useScheme();
  const canvas = paletteFor(scheme).canvas;
  const themeVars = useMemo(() => vars(colorVars(scheme)), [scheme]);

  // The window behind the screens (shown during transitions and under the keyboard).
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(canvas).catch(() => {});
  }, [canvas]);

  return <View style={[{ flex: 1, backgroundColor: canvas }, themeVars]}>{children}</View>;
}

export default ThemeProvider;
