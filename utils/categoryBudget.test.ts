import { limitsForMonth } from './categoryBudget';

describe('limitsForMonth', () => {
  const entries = [
    { categoryId: 'food', month: '2026-08', amount: 800 },
    { categoryId: 'food', month: '2026-10', amount: 1000 },
    { categoryId: 'leisure', month: '2026-09', amount: 300 },
    { categoryId: 'leisure', month: '2026-11', amount: null },
  ];

  it('uses, for each category, the limit that started most recently', () => {
    expect(limitsForMonth(entries, '2026-10')).toEqual({ food: 1000, leisure: 300 });
    expect(limitsForMonth(entries, '2026-09')).toEqual({ food: 800, leisure: 300 });
  });

  it('leaves out a category with no limit yet', () => {
    expect(limitsForMonth(entries, '2026-08')).toEqual({ food: 800 });
    expect(limitsForMonth(entries, '2026-07')).toEqual({});
  });

  it('a removed limit stays removed from that month on', () => {
    expect(limitsForMonth(entries, '2026-11')).toEqual({ food: 1000 });
    expect(limitsForMonth(entries, '2027-02')).toEqual({ food: 1000 });
  });

  it('ignores a limit of zero', () => {
    expect(limitsForMonth([{ categoryId: 'food', month: '2026-01', amount: 0 }], '2026-10')).toEqual({});
  });
});
