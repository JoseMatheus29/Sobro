import { type TransactionRecord } from '@/db/transactions';

export interface SummaryInput {
  /** Transactions of the month being looked at. */
  current: TransactionRecord[];
  /** Transactions of the month before it. */
  previous: TransactionRecord[];
  /** The user's monthly spending ceiling, if they set one. */
  budget: number | null;
  now: Date;
}

export interface MonthSummary {
  income: number;
  expense: number;
  /** income - expense: the balance of the month. */
  net: number;
  transactionCount: number;
  /** How much more (negative: less) the balance of the month is than the same stretch of the previous month, in reais; null when there was nothing to compare with. */
  netChange: number | null;
  /** Income against the same stretch of the previous month, as a ratio; null without income to compare with. */
  incomeChange: number | null;
  /** expense / income; null without income. */
  incomeUse: number | null;
  /** expense / budget; null without a budget. */
  budgetUse: number | null;
}
