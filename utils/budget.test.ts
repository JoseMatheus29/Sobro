import { budgetForMonth } from './budget';

describe('budgetForMonth', () => {
  const entries = [
    { month: '0000-00', amount: 2000 },
    { month: '2026-08', amount: 3000 },
    { month: '2026-10', amount: 2500 },
  ];

  it('uses the entry that started most recently on or before the month', () => {
    expect(budgetForMonth(entries, '2026-10')).toBe(2500);
    expect(budgetForMonth(entries, '2026-09')).toBe(3000);
    expect(budgetForMonth(entries, '2026-08')).toBe(3000);
    expect(budgetForMonth(entries, '2026-07')).toBe(2000);
  });

  it('keeps applying until it changes, including to later months', () => {
    expect(budgetForMonth(entries, '2027-03')).toBe(2500);
  });

  it('does not depend on the order of the entries', () => {
    expect(budgetForMonth([...entries].reverse(), '2026-09')).toBe(3000);
  });

  it('is null before the first entry and with no entries', () => {
    expect(budgetForMonth([{ month: '2026-08', amount: 3000 }], '2026-07')).toBeNull();
    expect(budgetForMonth([], '2026-10')).toBeNull();
  });

  it('is null from a month where the budget was removed', () => {
    const removed = [...entries, { month: '2026-11', amount: null }];
    expect(budgetForMonth(removed, '2026-10')).toBe(2500);
    expect(budgetForMonth(removed, '2026-11')).toBeNull();
    expect(budgetForMonth(removed, '2026-12')).toBeNull();
  });
});
