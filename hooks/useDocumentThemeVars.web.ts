import { useEffect } from 'react';

import { colorVars } from '@/constants/palette';

// In the browser the color variables (`--color-card`…) are plain CSS custom properties, so they only reach what
// is inside the element that sets them. A `Modal` is drawn in a portal on `<body>`, outside the ThemeProvider's
// view, and lost them: the card of a dialog had no background and its text had no color. Setting them on the
// page's root too puts every portal under them. They are replaced when the scheme changes.
export function useDocumentThemeVars(scheme: 'light' | 'dark'): void {
  useEffect(() => {
    const style = document.documentElement.style;
    const vars = colorVars(scheme);
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, String(value));
    return () => {
      for (const name of Object.keys(vars)) style.removeProperty(name);
    };
  }, [scheme]);
}
