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

// The month the phone's calendar is in. Not `monthKey(new Date())`: that reads UTC, which is already the next
// month from 21h on the last day in Brazil, while the transaction made then is dated with the local day.
export function currentMonthKey(now: Date = new Date()): string {
  return `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

// How many months from `from` to `to` (both 'YYYY-MM'): positive when `to` is later.
export function monthsBetween(from: string, to: string): number {
  const a = parseKey(from);
  const b = parseKey(to);
  return (b.year - a.year) * 12 + (b.month - a.month);
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
