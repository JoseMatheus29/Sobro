import { Appearance } from 'react-native';

import { schemeOverride } from '@/utils/theme';
import { type ThemePreference } from '@/utils/theme-type';

type Scheme = 'light' | 'dark';
type Listener = Parameters<typeof Appearance.addChangeListener>[0];
type WebAppearance = typeof Appearance & { sobro?: { forced: Scheme | null; listeners: Set<Listener> } };

// react-native-web's `Appearance` only reads the browser's setting: it has no `setColorScheme`, which is what
// broke the app on opening. The choice made in Perfil is laid over it here, once: `getColorScheme` answers the
// forced scheme and the listeners (the ones behind `useColorScheme()`) are told when it changes, so every screen
// redraws just as on the phone. The state lives on `Appearance` itself so a hot reload does not wrap it twice.
function install(): NonNullable<WebAppearance['sobro']> {
  const state = { forced: null as Scheme | null, listeners: new Set<Listener>() };
  const getSystem = Appearance.getColorScheme.bind(Appearance);
  const addSystemListener = Appearance.addChangeListener.bind(Appearance);

  Appearance.getColorScheme = () => state.forced ?? getSystem();
  Appearance.addChangeListener = (listener) => {
    state.listeners.add(listener);
    // The browser's own changes only count while the person has not picked a scheme.
    const system = addSystemListener((preferences) => {
      if (state.forced === null) listener(preferences);
    });
    return {
      remove() {
        state.listeners.delete(listener);
        system.remove();
      },
    };
  };
  return state;
}

// Forces the light or dark scheme on the whole page, or hands it back to the browser's.
export function applyTheme(preference: ThemePreference) {
  const web = Appearance as WebAppearance;
  const state = (web.sobro ??= install());
  state.forced = schemeOverride(preference);

  // Form fields and scrollbars drawn by the browser (the date field) follow the choice too.
  if (typeof document !== 'undefined') {
    document.documentElement.style.colorScheme = state.forced ?? 'light dark';
  }

  const colorScheme = Appearance.getColorScheme() ?? 'light';
  state.listeners.forEach((listener) => listener({ colorScheme }));
}
