// A recurring expense: either "every month" with no end, or an installment plan (n payments).
// Only the first occurrence is registered by hand (it is the transaction made when the recurrence is
// created); the following ones are created by the app when they fall due. Until then they are only
// planned, and exist as calculations, not as rows.
export interface RecurrenceRecord {
  id: number;
  cardId: number;
  cardName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  name: string;
  description: string | null;
  /** Positive magnitude of one occurrence. */
  amount: number;
  /** Day of the month it falls due (1-31; shorter months use their last day). */
  day: number;
  /** 'YYYY-MM' of the first occurrence, the one registered by hand. */
  startMonth: string;
  /** Number of that first occurrence: 1, or 4 for a "4 of 10" plan started halfway. */
  firstInstallment: number;
  /** Payments in the plan; null for "every month" with no end. */
  total: number | null;
  /** Last month it applies, once it was ended by hand; null while it goes on. */
  endMonth: string | null;
  /** Last month already turned into a transaction. */
  generatedUntil: string;
  /** How each occurrence is paid; the ones made inherit it. */
  paymentMethod?: 'pix' | 'debit' | 'credit' | null;
}

export interface Occurrence {
  /** 'YYYY-MM' */
  month: string;
  /** ISO 8601, noon UTC on the due day. */
  date: string;
  /** The number of the payment (1 for a plain monthly one counts from 1 too). */
  installment: number;
}

export type RepeatMode = 'none' | 'monthly' | 'installments';

/** A month ahead that has something planned in it, for the history. */
export interface FutureMonth {
  month: string;
  /** Sum of what is committed to go out: what is registered already plus what is planned. */
  total: number;
  /** The part of `total` that is already registered (purchases on credit whose invoice falls due in this month). */
  registered?: number;
  /** How many planned rows there are (the registered ones are not counted). */
  count: number;
  /** How many of them are installments. */
  installments: number;
  budget: number | null;
  /** total / budget; null without a budget. */
  budgetUse: number | null;
}

// How many months ahead the planned expenses are shown.
export const FORECAST_HORIZON = 6;
export const MAX_INSTALLMENTS = 99;
export const MIN_INSTALLMENTS = 2;

// Synthetic ids of planned rows are negative so they never collide with real transactions.
export const PLANNED_ID_BASE = 10000;
