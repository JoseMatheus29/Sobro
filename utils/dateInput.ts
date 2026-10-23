import { localDay } from '@/utils/invoice';

// The value of a browser date field is the calendar day as 'YYYY-MM-DD'. These two turn a Date into it and back,
// on the phone's calendar (`localDay`), so the day the person sees is the day that is saved.

export const toDateInputValue = localDay;

// The Date for the day written in a date field, keeping the time of day of `base` so only the day changes (as the
// phone's own picker does). null when the text is not a real day ('', '2026-02-31', a year before 1000).
export function fromDateInputValue(text: string, base: Date): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day, base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
  const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return real ? date : null;
}
