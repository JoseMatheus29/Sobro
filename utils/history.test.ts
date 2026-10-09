import { buildHistory, countKeptMonths } from './history';

const budgets = [{ month: '0000-00', amount: 3000 }];

describe('buildHistory', () => {
  const totals = [
    { month: '2026-08', income: 4100, expense: 2850 },
    { month: '2026-10', income: 4200, expense: 1386.4 },
    { month: '2026-09', income: 4100, expense: 3240.7 },
  ];

  it('lists the months newest first with what was left', () => {
    const history = buildHistory({ totals, budgets, currentMonth: '2026-10' });
    expect(history.map((h) => h.month)).toEqual(['2026-10', '2026-09', '2026-08']);
    expect(history[1].net).toBeCloseTo(859.3);
  });

  it('marks the current month', () => {
    const history = buildHistory({ totals, budgets, currentMonth: '2026-10' });
    expect(history.map((h) => h.current)).toEqual([true, false, false]);
  });

  it('lists the current month even when nothing was registered in it', () => {
    const history = buildHistory({ totals: [{ month: '2026-09', income: 100, expense: 50 }], budgets, currentMonth: '2026-10' });
    expect(history[0]).toMatchObject({ month: '2026-10', income: 0, expense: 0, net: 0, current: true });
    expect(history).toHaveLength(2);
  });

  it('judges each month by the budget it had', () => {
    const changing = [
      { month: '0000-00', amount: 3000 },
      { month: '2026-10', amount: 2000 },
    ];
    const history = buildHistory({ totals, budgets: changing, currentMonth: '2026-10' });
    expect(history[0].budget).toBe(2000);
    expect(history[0].budgetUse).toBeCloseTo(1386.4 / 2000);
    expect(history[1].budget).toBe(3000);
    expect(history[1].budgetUse).toBeCloseTo(3240.7 / 3000);
  });

  it('has no budget use without a budget', () => {
    const history = buildHistory({ totals, budgets: [], currentMonth: '2026-10' });
    expect(history[0].budget).toBeNull();
    expect(history[0].budgetUse).toBeNull();
  });

  it('is just the current month with no data at all', () => {
    const history = buildHistory({ totals: [], budgets: [], currentMonth: '2026-10' });
    expect(history).toHaveLength(1);
    expect(history[0].current).toBe(true);
  });
});

describe('countKeptMonths', () => {
  const entry = (month: string, net: number) => ({
    month, income: 0, expense: 0, net, budget: null, budgetUse: null, current: false,
  });

  it('counts the months with money left among the latest ones', () => {
    const entries = [entry('2026-10', 100), entry('2026-09', 0), entry('2026-08', -50), entry('2026-07', 10)];
    expect(countKeptMonths(entries)).toEqual({ kept: 3, total: 4 });
  });

  it('only looks at the latest months', () => {
    const entries = ['10', '09', '08', '07', '06', '05', '04', '03'].map((m) => entry(`2026-${m}`, m === '03' ? -1 : 1));
    expect(countKeptMonths(entries, 6)).toEqual({ kept: 6, total: 6 });
  });
});
