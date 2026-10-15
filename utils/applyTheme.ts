import { Appearance } from 'react-native';

import { schemeOverride } from '@/utils/theme';
import { type ThemePreference } from '@/utils/theme-type';

// Forces the light or dark scheme on the whole app (native dialogs included), or hands it back to the
// system's. `useColorScheme()` follows, so every screen redraws.
export function applyTheme(preference: ThemePreference) {
  // 'unspecified' hands the choice back to the system (React Native no longer takes null for it).
  Appearance.setColorScheme(schemeOverride(preference) ?? 'unspecified');
}
