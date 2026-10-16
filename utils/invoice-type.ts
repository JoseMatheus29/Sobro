import { type TransactionRecord } from '@/db/transactions';

// The hidden category of the payment of a credit card invoice (the server makes it with the payment).
export const INVOICE_CATEGORY_ID = 'invoice';

// The days of a credit card: when its invoice closes and when it falls due (1 to 31; a shorter month uses its last
// day, like the recurring expenses).
export interface InvoiceRules {
  closingDay: number;
  dueDay: number;
}

// open: it still takes purchases. closed: it closed and is waiting for the payment. overdue: closed and past its due
// day without being paid. paid: closed and nothing left to pay.
export type InvoiceStatus = 'open' | 'closed' | 'overdue' | 'paid';

export interface Invoice {
  /** 'YYYY-MM' of the month it closes in: the key of the invoice. */
  month: string;
  /** Calendar days, 'YYYY-MM-DD'. */
  opensOn: string;
  closesOn: string;
  dueOn: string;
  /** What the invoice comes to (positive): what was bought in the cycle plus what is already planned for it. */
  total: number;
  /** What was already paid of it (positive). */
  paid: number;
  /** What is left to pay of what was already bought (never negative): the planned part cannot be paid yet. */
  remaining: number;
  /** The part of `total` that is installments and recurring purchases not made yet (positive). */
  plannedTotal: number;
  status: InvoiceStatus;
  /** The purchases of the cycle, newest first, with the planned ones marked `planned`. */
  purchases: TransactionRecord[];
  /** The payments of this invoice, newest first. */
  payments: TransactionRecord[];
}

// How many invoices ahead can be looked at (the same horizon as the planned expenses).
export const INVOICE_MONTHS_AHEAD = 6;

// A payment of less than a cent is rounding, not a debt.
export const INVOICE_EPSILON = 0.005;
