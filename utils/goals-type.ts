// A caixinha (savings goal) reserves money that stays in the person's accounts: it moves no balance and
// is not an income or an expense, it only says how much of what they have is set aside for something.
export interface GoalRecord {
  id: number;
  name: string;
  targetAmount: number;
  /** 'YYYY-MM' the money should be saved by, or null for no deadline. */
  targetMonth: string | null;
  color: string;
  icon: string;
  /** What is in the caixinha: the sum of its entries. */
  saved: number;
}

export interface GoalEntryRecord {
  id: number;
  goalId: number;
  /** Positive when put in, negative when taken out. */
  amount: number;
  occurredAt: string;
}

export interface GoalProgress {
  saved: number;
  target: number;
  /** 0 to 1, for the bar. */
  fraction: number;
  /** Rounded, and it can pass 100 when more than the target was put in. */
  percent: number;
  remaining: number;
  reached: boolean;
  /** Months left to save in, counting the current one; null without a deadline; 0 once it has passed. */
  monthsLeft: number | null;
  /** What to put in each month to get there on time; null without a deadline, once reached, or once it has passed. */
  suggestedMonthly: number | null;
  /** The deadline went by and the target was not reached. */
  overdue: boolean;
}

export type MovementKind = 'deposit' | 'withdraw';

export type MovementProblem = 'invalid' | 'exceeds';

export const GOAL_NAME_MAX_LENGTH = 30;
// A goal can be set this many months ahead, and a new deadline starts this many months from now.
export const GOAL_MAX_MONTHS_AHEAD = 120;
export const GOAL_DEFAULT_MONTHS_AHEAD = 6;
