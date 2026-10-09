import { type BudgetEntry } from './budget';

/** What a month registered, as the database sums it. */
export interface MonthTotals {
  /** 'YYYY-MM' */
  month: string;
  income: number;
  expense: number;
}

export interface HistoryInput {
  totals: MonthTotals[];
  budgets: BudgetEntry[];
  /** 'YYYY-MM' of today: always listed, even before anything is registered in it. */
  currentMonth: string;
}

export interface HistoryEntry {
  month: string;
  income: number;
  expense: number;
  /** income - expense: what was left (negative: what was missing). */
  net: number;
  /** The budget that was in force in that month. */
  budget: number | null;
  /** expense / budget; null without a budget. */
  budgetUse: number | null;
  current: boolean;
}

// The summary line counts the most recent months only.
export const SUMMARY_MONTHS = 6;
