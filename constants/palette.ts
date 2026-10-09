// Single source of truth for the design tokens: consumed by tailwind.config.js
// (className usage) and by components that need a raw color value for props
// NativeWind can't reach (icon `color`, ActivityIndicator, gradients).
export const palette = {
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
  canvas: '#F7F9FC',
  ink: '#1A2B4A',
  muted: '#5A6B82',
  subtle: '#718096',
  line: '#EDF1F6',
  income: '#277F2B',
  expense: '#A83636',
};
