// A '#RRGGBB' color at about 14% opacity (the hex alpha channel), for the tinted chips and pills.
export function tint(color: string): string {
  return `${color}24`;
}
