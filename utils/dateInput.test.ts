import { fromDateInputValue, toDateInputValue } from '@/utils/dateInput';

describe('toDateInputValue', () => {
  it('writes the calendar day of the phone, with two-digit month and day', () => {
    expect(toDateInputValue(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateInputValue(new Date(2026, 9, 23, 0, 1))).toBe('2026-10-23');
  });
});

describe('fromDateInputValue', () => {
  const base = new Date(2026, 9, 1, 14, 30, 15, 250);

  it('gives the chosen day with the time of day of the base date', () => {
    const date = fromDateInputValue('2026-10-23', base);
    expect(date).not.toBeNull();
    expect([date!.getFullYear(), date!.getMonth(), date!.getDate()]).toEqual([2026, 9, 23]);
    expect([date!.getHours(), date!.getMinutes(), date!.getSeconds(), date!.getMilliseconds()]).toEqual([14, 30, 15, 250]);
  });

  it('round-trips with toDateInputValue', () => {
    expect(toDateInputValue(fromDateInputValue('2026-03-31', base)!)).toBe('2026-03-31');
    expect(toDateInputValue(fromDateInputValue('2024-02-29', base)!)).toBe('2024-02-29');
  });

  it('refuses what is not a real day', () => {
    expect(fromDateInputValue('', base)).toBeNull();
    expect(fromDateInputValue('2026-02-31', base)).toBeNull();
    expect(fromDateInputValue('2025-02-29', base)).toBeNull();
    expect(fromDateInputValue('0026-10-23', base)).toBeNull();
    expect(fromDateInputValue('23/10/2026', base)).toBeNull();
  });
});
