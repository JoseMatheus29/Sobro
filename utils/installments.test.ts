import { installmentDay, installmentLabels, installmentPlan } from '@/utils/installments';

const NUBANK = { closingDay: 5, dueDay: 12 };

describe('installmentDay', () => {
  it('is the purchase itself for the first installment and the same day of each month after', () => {
    expect(installmentDay('2026-08-24', 1)).toBe('2026-08-24');
    expect(installmentDay('2026-08-24', 3)).toBe('2026-10-24');
    expect(installmentDay('2026-11-15', 3)).toBe('2027-01-15');
  });

  it('falls on the last day of a month that is shorter', () => {
    expect(installmentDay('2026-08-31', 2)).toBe('2026-09-30');
    expect(installmentDay('2026-11-30', 4)).toBe('2027-02-28');
    expect(installmentDay('2027-11-30', 4)).toBe('2028-02-29');
  });
});

describe('installmentPlan', () => {
  it('an old purchase in its 3rd of 4 installments goes from the invoice of this month to the next one', () => {
    // Bought on 24/08, invoice closing on the 5th: 1/4 in Sep, 2/4 in Oct, 3/4 in Nov, 4/4 in Dec.
    const plan = installmentPlan({
      purchaseDay: '2026-08-24',
      total: 4,
      current: 3,
      rules: NUBANK,
      today: '2026-10-23',
    });
    expect(plan).toMatchObject({
      current: 3,
      total: 4,
      firstDay: '2026-10-24',
      lastDay: '2026-11-24',
      firstPeriod: '2026-11',
      lastPeriod: '2026-12',
      skipped: 2,
      onCredit: true,
      notYet: false,
    });
  });

  it('a purchase made today starts at its own day and skips nothing', () => {
    const plan = installmentPlan({ purchaseDay: '2026-10-23', total: 6, current: 1, rules: NUBANK, today: '2026-10-23' });
    expect(plan).toMatchObject({ firstDay: '2026-10-23', firstPeriod: '2026-11', lastPeriod: '2027-04', skipped: 0, notYet: false });
  });

  it('a card closing on the 25th and due on the 5th names the invoice by its due month: 3rd in November, last in December', () => {
    const plan = installmentPlan({
      purchaseDay: '2026-08-24',
      total: 4,
      current: 3,
      rules: { closingDay: 25, dueDay: 5 },
      today: '2026-10-23',
    });
    // 24/10 is still in the invoice that closes on 25/10, due on 05/11; 24/11, in the one due on 05/12.
    expect(plan).toMatchObject({ firstDay: '2026-10-24', firstPeriod: '2026-11', lastPeriod: '2026-12', notYet: false });
  });

  it('an installment that is in a later invoice than the open one has not arrived', () => {
    const plan = installmentPlan({ purchaseDay: '2026-10-23', total: 6, current: 3, rules: NUBANK, today: '2026-10-23' });
    expect(plan).toMatchObject({ firstDay: '2026-12-23', firstPeriod: '2027-01', notYet: true });
  });

  it('without a credit card the plan is placed in months', () => {
    const base = { purchaseDay: '2026-08-24', total: 4, current: 3, rules: null };
    expect(installmentPlan({ ...base, today: '2026-10-23' })).toMatchObject({
      firstPeriod: '2026-10',
      lastPeriod: '2026-11',
      onCredit: false,
      notYet: false,
    });
    expect(installmentPlan({ ...base, today: '2026-09-10' }).notYet).toBe(true);
  });
});

describe('installmentLabels', () => {
  it('names the months, with the year on the last one only when the plan changes year', () => {
    const base = { purchaseDay: '2026-08-24', rules: NUBANK, today: '2026-10-23' };
    expect(installmentLabels(installmentPlan({ ...base, total: 4, current: 3 }))).toEqual({ first: 'novembro', last: 'dezembro' });
    expect(installmentLabels(installmentPlan({ ...base, total: 10, current: 3 }))).toEqual({
      first: 'novembro',
      last: 'junho 2027',
    });
  });
});
