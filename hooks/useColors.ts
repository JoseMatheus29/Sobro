import { useCallback } from 'react';
import { useColorScheme } from 'react-native';

import { paletteFor, type ColorScheme, type Palette } from '@/constants/palette';
import { softenColor } from '@/utils/color';

/** The scheme the app is drawn in: the system one. */
export function useScheme(): ColorScheme {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

/** The palette of the active scheme, for the props className can't reach (icon `color`, `style`, gradients). */
export function useColors(): Palette {
  return paletteFor(useScheme());
}

/** A category's color as it should be drawn: as stored on the light theme, softened on the dark one. */
export function useCategoryColor(): (color: string) => string {
  const scheme = useScheme();
  return useCallback((color: string) => (scheme === 'dark' ? softenColor(color) : color), [scheme]);
}
