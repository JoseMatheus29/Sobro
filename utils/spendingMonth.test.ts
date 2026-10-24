import { invoiceDueMonth, spendingDayOf, spendingMonthOf } from '@/utils/invoice';

// The cases of docs/api-mes-do-gasto.md: the app and the server must answer the same.
const FECHA_3_VENCE_10 = { closingDay: 3, dueDay: 10 };
const FECHA_25_VENCE_5 = { closingDay: 25, dueDay: 5 };
const FECHA_31_VENCE_5 = { closingDay: 31, dueDay: 5 };

describe('invoiceDueMonth', () => {
  it('is the month it closes in when the due day comes after the closing day', () => {
    expect(invoiceDueMonth('2026-11', FECHA_3_VENCE_10)).toBe('2026-11');
  });

  it('is the next month when the due day comes before the closing day', () => {
    expect(invoiceDueMonth('2026-11', FECHA_25_VENCE_5)).toBe('2026-12');
    expect(invoiceDueMonth('2026-12', FECHA_25_VENCE_5)).toBe('2027-01');
  });
});

describe('spendingMonthOf', () => {
  it('counts a purchase on credit in the month its invoice is due in (closes day 3, due day 10)', () => {
    expect(spendingMonthOf('2026-10-27', 'credit', FECHA_3_VENCE_10)).toBe('2026-11');
    expect(spendingMonthOf('2026-11-03', 'credit', FECHA_3_VENCE_10)).toBe('2026-11');
    expect(spendingMonthOf('2026-11-05', 'credit', FECHA_3_VENCE_10)).toBe('2026-12');
  });

  it('counts it a month later when the invoice is due in the month after it closes (closes day 25, due day 5)', () => {
    expect(spendingMonthOf('2026-10-25', 'credit', FECHA_25_VENCE_5)).toBe('2026-11');
    expect(spendingMonthOf('2026-10-27', 'credit', FECHA_25_VENCE_5)).toBe('2026-12');
    expect(spendingMonthOf('2026-11-25', 'credit', FECHA_25_VENCE_5)).toBe('2026-12');
    expect(spendingMonthOf('2026-11-26', 'credit', FECHA_25_VENCE_5)).toBe('2027-01');
  });

  it('a closing day past the end of a short month is its last day', () => {
    expect(spendingMonthOf('2026-02-28', 'credit', FECHA_31_VENCE_5)).toBe('2026-03');
  });

  it('keeps everything that is not credit in the month of its day', () => {
    expect(spendingMonthOf('2026-10-27', 'pix', FECHA_25_VENCE_5)).toBe('2026-10');
    expect(spendingMonthOf('2026-10-27', 'debit', FECHA_25_VENCE_5)).toBe('2026-10');
    expect(spendingMonthOf('2026-10-27', null, FECHA_25_VENCE_5)).toBe('2026-10');
    expect(spendingMonthOf('2026-10-27', undefined, null)).toBe('2026-10');
  });

  it('credit on an account without the card days falls back to the day', () => {
    expect(spendingMonthOf('2026-10-27', 'credit', null)).toBe('2026-10');
  });
});

describe('spendingDayOf', () => {
  it('is the due day of the invoice on credit and the day itself otherwise', () => {
    expect(spendingDayOf('2026-10-27', 'credit', FECHA_3_VENCE_10)).toBe(10);
    expect(spendingDayOf('2026-10-27', 'credit', FECHA_25_VENCE_5)).toBe(5);
    expect(spendingDayOf('2026-10-27', 'pix', FECHA_25_VENCE_5)).toBe(27);
    expect(spendingDayOf('2026-10-27', null, null)).toBe(27);
  });
});
