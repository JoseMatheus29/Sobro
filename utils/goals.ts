import { type GoalProgress, type MovementKind, type MovementProblem } from './goals-type';
import { monthKey, monthsBetween } from './month';

const cents = (value: number) => Math.round(value * 100) / 100;

// Where a caixinha stands: how much is in it, how much is missing and, with a deadline, how much to put
// in each month. Counting the current month as one to save in: "until December" asked in October is 3 months.
export function goalProgress(
  goal: { targetAmount: number; targetMonth: string | null; saved: number },
  now: Date
): GoalProgress {
  const saved = Math.max(0, cents(goal.saved));
  const target = goal.targetAmount;
  const reached = target > 0 && saved >= target;
  const remaining = Math.max(0, cents(target - saved));

  let monthsLeft: number | null = null;
  let suggestedMonthly: number | null = null;
  let overdue = false;
  if (goal.targetMonth) {
    const apart = monthsBetween(monthKey(now), goal.targetMonth);
    if (apart < 0) {
      monthsLeft = 0;
      overdue = !reached;
    } else {
      monthsLeft = apart + 1;
      if (!reached) suggestedMonthly = Math.ceil((remaining / monthsLeft) * 100) / 100;
    }
  }

  return {
    saved,
    target,
    fraction: target > 0 ? Math.min(1, saved / target) : 0,
    percent: target > 0 ? Math.round((saved / target) * 100) : 0,
    remaining,
    reached,
    monthsLeft,
    suggestedMonthly,
    overdue,
  };
}

// The total set aside in every caixinha.
export function totalReserved(goals: { saved: number }[]): number {
  return cents(goals.reduce((sum, goal) => sum + Math.max(0, goal.saved), 0));
}

// What is left of the money in the accounts once what is reserved is set aside. It can be negative:
// that means more is reserved than there is.
export function freeBalance(accountBalances: number[], reserved: number): number {
  return cents(accountBalances.reduce((sum, balance) => sum + balance, 0) - reserved);
}

// Whether an amount can go in or out of a caixinha: only what is in it can be taken out.
export function movementProblem(kind: MovementKind, amount: number, saved: number): MovementProblem | null {
  if (!Number.isFinite(amount) || amount <= 0) return 'invalid';
  if (kind === 'withdraw' && cents(amount) > cents(saved)) return 'exceeds';
  return null;
}
