// `?a=1&b=x` from the parameters that have a value; empty when none does. Written by hand: the URLSearchParams of
// React Native does not serialize on every version.
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
