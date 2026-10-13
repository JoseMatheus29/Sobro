// A '#RRGGBB' color at about 14% opacity (the hex alpha channel), for the tinted chips and pills.
export function tint(color: string): string {
  return `${color}24`;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const part = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

// The category colors are the saturated "flat UI" tones the person picked or the seed brought, which glare
// on a dark background. Less saturation and a lightness between 56% and 64% keep the hue (it is still
// recognizably that category) in a dusty version; anything that is not '#RRGGBB' is left as it is.
export function softenColor(color: string): string {
  if (!HEX.test(color)) return color;
  const [h, s, l] = hexToHsl(color);
  return hslToHex(h, Math.min(s * 0.55, 0.42), Math.min(0.64, Math.max(0.56, l)));
}
