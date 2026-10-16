// How what was spent in a month was paid.
export type PaymentKind = 'pix' | 'debit' | 'credit' | 'other';

// The order they are drawn in. "other" is what says nothing about how it was paid (made before "Como pagou" existed,
// or on an account without a credit card).
export const PAYMENT_KIND_ORDER: PaymentKind[] = ['pix', 'debit', 'credit', 'other'];

export interface PaymentSlice {
  kind: PaymentKind;
  /** Positive. */
  amount: number;
  /** Whole percent of the total; the slices add up to exactly 100. */
  percent: number;
}

export interface PaymentSplit {
  /** What was spent (positive): the same figure as the month's spending. */
  total: number;
  /** Only the ones with something in them. */
  slices: PaymentSlice[];
}
