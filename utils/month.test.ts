import {
  addMonths,
  daysInMonth,
  monthEnd,
  monthKey,
  monthKeyToDate,
  monthKeyWithYear,
  monthNameOf,
  monthsBetween,
  monthTitle,
  previousMonthKey,
} from './month';

describe('month helpers', () => {
  it('reads the month of a date in UTC', () => {
    expect(monthKey(new Date('2026-10-09T12:00:00.000Z'))).toBe('2026-10');
    expect(monthKey(new Date('2026-10-31T23:59:59.000Z'))).toBe('2026-10');
  });

  it('finds the previous month, across a year', () => {
    expect(previousMonthKey(new Date('2026-10-09T12:00:00.000Z'))).toBe('2026-09');
    expect(previousMonthKey(new Date('2026-01-15T12:00:00.000Z'))).toBe('2025-12');
  });

  it('adds and subtracts months, across years', () => {
    expect(addMonths('2026-10', -1)).toBe('2026-09');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-10', 0)).toBe('2026-10');
  });

  it('knows how long a month is', () => {
    expect(daysInMonth(new Date('2026-10-09T12:00:00.000Z'))).toBe(31);
    expect(daysInMonth(new Date('2026-02-09T12:00:00.000Z'))).toBe(28);
    expect(daysInMonth(new Date('2028-02-09T12:00:00.000Z'))).toBe(29);
  });

  it('turns a key into the first and last day', () => {
    expect(monthKeyToDate('2026-09').toISOString()).toBe('2026-09-01T12:00:00.000Z');
    expect(monthEnd('2026-09').toISOString()).toBe('2026-09-30T12:00:00.000Z');
    expect(monthEnd('2026-02').getUTCDate()).toBe(28);
  });

  it('writes the month for people', () => {
    expect(monthNameOf('2026-03')).toBe('março');
    expect(monthKeyWithYear('2026-10')).toBe('outubro 2026');
    expect(monthTitle('2026-10')).toBe('Outubro 2026');
  });
});

describe('monthsBetween', () => {
  it('counts the months from one key to another', () => {
    expect(monthsBetween('2026-10', '2026-12')).toBe(2);
    expect(monthsBetween('2026-10', '2026-10')).toBe(0);
    expect(monthsBetween('2026-10', '2027-02')).toBe(4);
  });

  it('is negative when the second is earlier', () => {
    expect(monthsBetween('2026-10', '2026-08')).toBe(-2);
    expect(monthsBetween('2027-01', '2026-12')).toBe(-1);
  });
});
