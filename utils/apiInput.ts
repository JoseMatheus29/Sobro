// Turns what the screens hold into what the API takes.

// The day a person sees, as the date of a transaction: the calendar day on the phone, at noon UTC
// (`2026-10-05T12:00:00.000Z`). `date.toISOString()` is wrong here: at 22h in Brazil it is already the next
// day in UTC, and the purchase would land in the following month.
export function calendarDayAtNoonUtc(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T12:00:00.000Z`;
}

// Cents typed in a field, as the number the API takes: two places at most, never a float with more.
export function centsToAmount(cents: number): number {
  return Math.round(cents) / 100;
}

// A number of the API with its places cut to two, so 0.1 + 0.2 does not travel as 0.30000000000000004.
export function roundAmount(value: number): number {
  return Math.round(value * 100) / 100;
}
