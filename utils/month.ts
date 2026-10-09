// Months are 'YYYY-MM' keys read in UTC: transactions store `occurredAt` as an ISO 8601 (UTC) string
// and the queries filter it with `LIKE 'YYYY-MM%'`, so every screen has to read the calendar the same way.

export const MONTH_NAMES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function previousMonthKey(date: Date): string {
  return monthKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)));
}

export function daysInMonth(date: Date): number {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

// "outubro 2026"
export function monthWithYear(date: Date): string {
  return `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
