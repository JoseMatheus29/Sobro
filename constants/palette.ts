// Single source of truth for the design tokens, in a light and a dark version.
//
// - className usage: tailwind.config.js maps every token to a CSS variable (`bg-canvas`, `text-ink`…)
//   and ThemeProvider sets the variables of the active scheme, so classes never change with the theme.
// - raw values (icon `color`, ActivityIndicator, gradients, `style`): `useColors()` from
//   '@/hooks/useColors' returns the palette of the active scheme.
// - `palette` below is the light palette as a plain constant, for what has a fixed look in both themes
//   (filled buttons with white text, the account cards).
export interface Palette {
  /** Which of the two this is: for the few places that look different, not just recolored. */
  scheme: ColorScheme;
  primary: { DEFAULT: string; light: string; lighter: string; dark: string };
  surface: { DEFAULT: string; dark: string };
  /** Cards, sheets, the tab bar: what sits on top of `canvas`. */
  card: string;
  canvas: string;
  ink: string;
  muted: string;
  subtle: string;
  line: string;
  placeholder: string;
  /** The moving piece of a segmented toggle. */
  thumb: string;
  income: string;
  expense: string;
  /** Between green and red: a budget close to its ceiling. */
  warning: string;
  /** What belongs to someone else's finances (a managed profile): its banner, its avatar. Tinted for fills. */
  managed: string;
  /** Title, greeting and icons on the header: white on the blue band, ink on the dark canvas. */
  headerInk: string;
  /** Behind the title of the tab screens, darkest end first: a blue band in light, the canvas itself in dark. */
  headerGradient: [string, string, string];
  /** Left-to-right gradient of the main button (white text on top). */
  buttonGradient: [string, string];
  /** The main button while it can't be pressed yet. */
  disabledGradient: [string, string];
}

export type ColorScheme = 'light' | 'dark';

export const lightPalette: Palette = {
  scheme: 'light',
  primary: {
    DEFAULT: '#3161B2',
    light: '#4A74BB',
    lighter: '#7998CD',
    dark: '#254E8F',
  },
  surface: {
    DEFAULT: '#EBF1F6',
    dark: '#D4E1EF',
  },
  card: '#FFFFFF',
  canvas: '#F7F9FC',
  ink: '#1A2B4A',
  muted: '#5A6B82',
  subtle: '#718096',
  line: '#EDF1F6',
  placeholder: '#A3B0C2',
  thumb: '#FFFFFF',
  income: '#277F2B',
  expense: '#A83636',
  warning: '#A8680A',
  managed: '#6A5A9E',
  headerInk: '#FFFFFF',
  headerGradient: ['#1E3F7A', '#3161B2', '#4A74BB'],
  buttonGradient: ['#3161B2', '#4A74BB'],
  disabledGradient: ['#B8C4D6', '#C9D3E1'],
};

// Slate: neutrals lifted out of black (the canvas is around 11% light, not 7%) and tinted with the brand's
// blue, in three steps you can see (canvas, card, chip), so the dark theme is a blue-gray of its own rather
// than a black slab. The brand blue is the accent and the button fill, and the green, red and yellow of the
// badges are earth pigments (leaf, urucum, ochre) instead of the mint, coral and amber every dark UI uses.
// No band behind the title, no glow, hairline borders.
export const darkPalette: Palette = {
  scheme: 'dark',
  primary: {
    DEFAULT: '#8FAADB',
    light: '#6F90C6',
    lighter: '#8FAADB',
    dark: '#3A5FA3',
  },
  surface: {
    DEFAULT: '#262D38',
    dark: '#303847',
  },
  card: '#1D232C',
  canvas: '#151A21',
  ink: '#E6EAF0',
  muted: '#A0A9B8',
  subtle: '#8290A3',
  line: '#252C37',
  placeholder: '#66748A',
  thumb: '#343E4D',
  income: '#8CB369',
  expense: '#E07560',
  warning: '#D2A94A',
  managed: '#C3B8DD',
  headerInk: '#E6EAF0',
  headerGradient: ['#151A21', '#151A21', '#151A21'],
  buttonGradient: ['#3A5FA3', '#4569AE'],
  disabledGradient: ['#303847', '#2B3340'],
};

/** The light palette as a plain constant: only for what looks the same in both themes. */
export const palette = lightPalette;

export function paletteFor(scheme: ColorScheme | null | undefined): Palette {
  return scheme === 'dark' ? darkPalette : lightPalette;
}

// --- CSS variables (consumed by tailwind.config.js and ThemeProvider) ---

type TokenMap = Record<string, string>;

// 'primary.light' -> 'primary-light'; DEFAULT -> the group name.
function tokenName(group: string, key: string): string {
  return key === 'DEFAULT' ? group : `${group}-${key}`;
}

// What is not a color the classes can use: the scheme's name and the gradients (arrays).
const isColorToken = (name: string, value: unknown) => name !== 'scheme' && !Array.isArray(value);

/** Every plain color of a palette by token name: { 'primary-light': '#4A74BB', canvas: '#F7F9FC', … }. */
export function colorTokens(p: Palette): TokenMap {
  const tokens: TokenMap = {};
  for (const [name, value] of Object.entries(p)) {
    if (!isColorToken(name, value)) continue;
    if (typeof value === 'string') tokens[name] = value;
    else {
      for (const [key, color] of Object.entries(value as Record<string, string>)) tokens[tokenName(name, key)] = color;
    }
  }
  return tokens;
}

function hexToTriplet(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** { '--color-primary-light': '74 116 187', … }: the shape `vars()` from NativeWind takes. */
export function colorVars(scheme: ColorScheme): TokenMap {
  const vars: TokenMap = {};
  for (const [name, hex] of Object.entries(colorTokens(paletteFor(scheme)))) vars[`--color-${name}`] = hexToTriplet(hex);
  return vars;
}

/** The `colors` of tailwind.config.js: nested like the palette, each value pointing at its CSS variable. */
export function tailwindColors(): Record<string, string | Record<string, string>> {
  const ref = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;
  const colors: Record<string, string | Record<string, string>> = {};
  for (const [name, value] of Object.entries(lightPalette)) {
    if (!isColorToken(name, value)) continue;
    if (typeof value === 'string') colors[name] = ref(name);
    else {
      const group: Record<string, string> = {};
      for (const key of Object.keys(value)) group[key] = ref(tokenName(name, key));
      colors[name] = group;
    }
  }
  return colors;
}
