import { colorTokens, colorVars, darkPalette, lightPalette, tailwindColors, type Palette } from './palette';

// WCAG relative luminance and contrast ratio of two '#RRGGBB' colors.
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const schemes: [string, Palette][] = [
  ['light', lightPalette],
  ['dark', darkPalette],
];

describe('palette', () => {
  it('has the same tokens in the light and the dark scheme', () => {
    expect(Object.keys(colorTokens(darkPalette)).sort()).toEqual(Object.keys(colorTokens(lightPalette)).sort());
  });

  it('keeps the scheme name and the gradients out of the CSS variables', () => {
    expect(Object.keys(colorVars('dark')).some((name) => name.includes('scheme') || name.includes('Gradient'))).toBe(false);
    expect(colorVars('dark')['--color-headerInk']).toBe('230 234 240');
  });

  it('builds a CSS variable for every token, as an "r g b" triplet', () => {
    const vars = colorVars('light');
    expect(vars['--color-canvas']).toBe('247 249 252');
    expect(vars['--color-primary-light']).toBe('74 116 187');
    expect(Object.keys(vars)).toHaveLength(Object.keys(colorTokens(lightPalette)).length);
  });

  it('points every tailwind color at its CSS variable', () => {
    const colors = tailwindColors() as Record<string, any>;
    expect(colors.canvas).toBe('rgb(var(--color-canvas) / <alpha-value>)');
    expect(colors.primary.DEFAULT).toBe('rgb(var(--color-primary) / <alpha-value>)');
    expect(colors.primary.lighter).toBe('rgb(var(--color-primary-lighter) / <alpha-value>)');
    expect(colors.surface.dark).toBe('rgb(var(--color-surface-dark) / <alpha-value>)');
  });

  describe.each(schemes)('%s scheme', (_name, p) => {
    const grounds = [p.canvas, p.card];

    it.each(grounds)('keeps body text readable on %s', (ground) => {
      expect(contrast(p.ink, ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.muted, ground)).toBeGreaterThanOrEqual(4.5);
      // The lightest text token (hints and captions); the light value predates the dark theme and sits near 3.8.
      expect(contrast(p.subtle, ground)).toBeGreaterThanOrEqual(3.5);
    });

    it.each(grounds)('keeps the colored text and icons readable on %s', (ground) => {
      for (const color of [p.primary.DEFAULT, p.income, p.expense, p.warning]) {
        expect(contrast(color, ground)).toBeGreaterThanOrEqual(4);
      }
    });

    it('keeps white text readable on the filled main button', () => {
      expect(contrast('#FFFFFF', p.buttonGradient[0])).toBeGreaterThanOrEqual(4.5);
    });

    it('names its scheme', () => {
      expect(p.scheme).toBe(_name);
    });

    it('keeps the header title readable on every stop of what is behind it', () => {
      for (const stop of p.headerGradient) {
        expect(contrast(p.headerInk, stop)).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('tells the card apart from the canvas and the track from the card', () => {
      expect(p.card).not.toBe(p.canvas);
      expect(p.surface.DEFAULT).not.toBe(p.card);
      expect(contrast(p.surface.dark, p.card)).toBeGreaterThan(1.1);
    });
  });
});
