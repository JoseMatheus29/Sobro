// On the phone the theme's CSS variables reach a `Modal` through React (NativeWind passes them down), so there
// is nothing to do. `useDocumentThemeVars.web.ts` is the browser's version.
export function useDocumentThemeVars(_scheme: 'light' | 'dark'): void {}
