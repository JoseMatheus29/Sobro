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

function parseKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month: month - 1 };
}

// Noon on the first day, so a local time zone never moves it to another day.
export function monthKeyToDate(key: string): Date {
  const { year, month } = parseKey(key);
  return new Date(Date.UTC(year, month, 1, 12));
}

// Noon on the last day of the month: the "today" to compare a finished month with the one before it.
export function monthEnd(key: string): Date {
  const { year, month } = parseKey(key);
  return new Date(Date.UTC(year, month + 1, 0, 12));
}

export function addMonths(key: string, delta: number): string {
  const { year, month } = parseKey(key);
  return monthKey(new Date(Date.UTC(year, month + delta, 1, 12)));
}

// "outubro"
export function monthNameOf(key: string): string {
  return MONTH_NAMES[parseKey(key).month];
}

// "outubro 2026"
export function monthKeyWithYear(key: string): string {
  return `${monthNameOf(key)} ${parseKey(key).year}`;
}

// "Outubro 2026", for titles and buttons.
export function monthTitle(key: string): string {
  const label = monthKeyWithYear(key);
  return label.charAt(0).toUpperCase() + label.slice(1);
}
