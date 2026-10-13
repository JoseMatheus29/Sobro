import { freeBalance, goalProgress, movementProblem, totalReserved } from './goals';

const NOW = new Date('2026-10-12T12:00:00.000Z');

describe('goalProgress', () => {
  it('measures how much of the target is in', () => {
    const p = goalProgress({ targetAmount: 2000, targetMonth: null, saved: 500 }, NOW);
    expect(p.saved).toBe(500);
    expect(p.fraction).toBe(0.25);
    expect(p.percent).toBe(25);
    expect(p.remaining).toBe(1500);
    expect(p.reached).toBe(false);
  });

  it('has no deadline numbers without a deadline', () => {
    const p = goalProgress({ targetAmount: 2000, targetMonth: null, saved: 0 }, NOW);
    expect(p.monthsLeft).toBeNull();
    expect(p.suggestedMonthly).toBeNull();
    expect(p.overdue).toBe(false);
  });

  it('counts the current month as one to save in', () => {
    // October, November and December.
    const p = goalProgress({ targetAmount: 3000, targetMonth: '2026-12', saved: 0 }, NOW);
    expect(p.monthsLeft).toBe(3);
    expect(p.suggestedMonthly).toBe(1000);
  });

  it('suggests what is missing divided by the months left, rounded up to the cent', () => {
    const p = goalProgress({ targetAmount: 1000, targetMonth: '2026-12', saved: 0 }, NOW);
    expect(p.suggestedMonthly).toBe(333.34);
    const half = goalProgress({ targetAmount: 3000, targetMonth: '2026-12', saved: 1500 }, NOW);
    expect(half.suggestedMonthly).toBe(500);
  });

  it('asks for all of it this month when the deadline is the current month', () => {
    const p = goalProgress({ targetAmount: 600, targetMonth: '2026-10', saved: 100 }, NOW);
    expect(p.monthsLeft).toBe(1);
    expect(p.suggestedMonthly).toBe(500);
  });

  it('is overdue once the deadline went by without reaching the target', () => {
    const p = goalProgress({ targetAmount: 600, targetMonth: '2026-09', saved: 100 }, NOW);
    expect(p.overdue).toBe(true);
    expect(p.monthsLeft).toBe(0);
    expect(p.suggestedMonthly).toBeNull();
  });

  it('is reached at the target, and past a deadline that is not a problem anymore', () => {
    const exact = goalProgress({ targetAmount: 600, targetMonth: '2026-12', saved: 600 }, NOW);
    expect(exact.reached).toBe(true);
    expect(exact.suggestedMonthly).toBeNull();
    expect(exact.remaining).toBe(0);

    const late = goalProgress({ targetAmount: 600, targetMonth: '2026-09', saved: 700 }, NOW);
    expect(late.reached).toBe(true);
    expect(late.overdue).toBe(false);
  });

  it('lets the percentage pass 100 but never the bar', () => {
    const p = goalProgress({ targetAmount: 500, targetMonth: null, saved: 750 }, NOW);
    expect(p.percent).toBe(150);
    expect(p.fraction).toBe(1);
  });

  it('does not break on a zero target or a negative total', () => {
    expect(goalProgress({ targetAmount: 0, targetMonth: null, saved: 0 }, NOW).fraction).toBe(0);
    expect(goalProgress({ targetAmount: 100, targetMonth: null, saved: -5 }, NOW).saved).toBe(0);
  });
});

describe('totalReserved and freeBalance', () => {
  it('adds up what is in every caixinha', () => {
    expect(totalReserved([{ saved: 500 }, { saved: 250.5 }])).toBe(750.5);
    expect(totalReserved([])).toBe(0);
  });

  it('is what the accounts hold minus what is reserved', () => {
    expect(freeBalance([1000, 500], 400)).toBe(1100);
  });

  it('goes negative when more is reserved than there is', () => {
    expect(freeBalance([100], 400)).toBe(-300);
  });
});

describe('movementProblem', () => {
  it('accepts a positive amount', () => {
    expect(movementProblem('deposit', 50, 0)).toBeNull();
    expect(movementProblem('withdraw', 50, 50)).toBeNull();
  });

  it('refuses zero, negative and not-a-number amounts', () => {
    expect(movementProblem('deposit', 0, 0)).toBe('invalid');
    expect(movementProblem('deposit', -10, 0)).toBe('invalid');
    expect(movementProblem('withdraw', Number.NaN, 100)).toBe('invalid');
  });

  it('only lets out what is in', () => {
    expect(movementProblem('withdraw', 80.01, 80)).toBe('exceeds');
    expect(movementProblem('deposit', 80.01, 80)).toBeNull();
  });
});
