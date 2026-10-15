import { calendarDayAtNoonUtc, centsToAmount, roundAmount } from './apiInput';

describe('calendarDayAtNoonUtc', () => {
  // Dates built from the phone's own calendar fields, so the result does not depend on the time zone the tests run in.
  it('keeps the day the person sees, at noon UTC', () => {
    expect(calendarDayAtNoonUtc(new Date(2026, 9, 5, 9, 15))).toBe('2026-10-05T12:00:00.000Z');
  });

  it('keeps the day for a purchase made late at night', () => {
    expect(calendarDayAtNoonUtc(new Date(2026, 9, 31, 22, 30))).toBe('2026-10-31T12:00:00.000Z');
    expect(calendarDayAtNoonUtc(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31T12:00:00.000Z');
  });

  it('keeps the day just after midnight', () => {
    expect(calendarDayAtNoonUtc(new Date(2026, 10, 1, 0, 5))).toBe('2026-11-01T12:00:00.000Z');
  });

  it('pads the month and the day', () => {
    expect(calendarDayAtNoonUtc(new Date(2026, 0, 3, 8))).toBe('2026-01-03T12:00:00.000Z');
  });
});

describe('centsToAmount', () => {
  it('turns cents into a number with two places', () => {
    expect(centsToAmount(12050)).toBe(120.5);
    expect(centsToAmount(1)).toBe(0.01);
    expect(centsToAmount(0)).toBe(0);
  });

  it('never carries more than two places', () => {
    expect(centsToAmount(1999)).toBe(19.99);
    expect(centsToAmount(3)).toBe(0.03);
  });
});

describe('roundAmount', () => {
  it('cuts to two places', () => {
    expect(roundAmount(0.1 + 0.2)).toBe(0.3);
    expect(roundAmount(120.456)).toBe(120.46);
  });
});
