import { carryOver } from './carryOver';
import { type MonthTotals } from './history-type';

const totals: MonthTotals[] = [
  { month: '2026-08', income: 3000, expense: 2500 },
  { month: '2026-09', income: 3000, expense: 3200 },
  { month: '2026-10', income: 5000, expense: 3000 },
  // A purchase on credit can already count in a month ahead.
  { month: '2026-12', income: 0, expense: 400 },
];

describe('carryOver', () => {
  it('is the starting balance when there is nothing before the month', () => {
    expect(carryOver([], '2026-10', 150)).toBe(150);
    expect(carryOver(totals, '2026-08', 150)).toBe(150);
  });

  it('adds what was left of every month before it', () => {
    // 500 - 200 + 2000
    expect(carryOver(totals, '2026-11', 0)).toBe(2300);
  });

  it('starts from the starting balance of the accounts', () => {
    expect(carryOver(totals, '2026-11', 1000)).toBe(3300);
  });

  it('does not count the month itself nor the ones after it', () => {
    expect(carryOver(totals, '2026-10', 0)).toBe(300);
    expect(carryOver(totals, '2026-11', 0)).toBe(2300);
  });

  it('can be negative: a month that spent more than it received takes from what came before', () => {
    expect(carryOver(totals, '2026-10', 0)).toBeGreaterThan(0);
    expect(carryOver([{ month: '2026-01', income: 100, expense: 900 }], '2026-02', 0)).toBe(-800);
  });

  it('does not depend on the order of the totals', () => {
    expect(carryOver([...totals].reverse(), '2026-11', 0)).toBe(2300);
  });
});
