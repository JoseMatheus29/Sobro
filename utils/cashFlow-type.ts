// What came in and what went out of the accounts in a month, apart from what was bought on credit: that only leaves
// when its invoice is paid, and the payment is the outflow.
export interface MonthCash {
  income: number;
  /** Everything that left the accounts: spending paid at once and the payments of invoices. Positive. */
  outflow: number;
}

// The money the person can spend, at the end and at the start of a month.
export interface CashPosition {
  /** At the end of the month (today, for the current one): the accounts' balances minus what is set aside in caixinhas. */
  closing: number;
  /** When the month started. */
  opening: number;
  /** What the month did to it: income - outflow - what went into caixinhas. */
  change: number;
}

// What the Fluxo de Caixa of the Início shows for a month.
export interface FlowSummary {
  income: number;
  /** Money that left the accounts (see `MonthCash.outflow`). */
  expense: number;
  /** Net put into caixinhas in the month (negative: taken out). */
  saved: number;
  /** Income against the same stretch of the previous month, as a ratio; null without income to compare with. */
  incomeChange: number | null;
  /** expense / income; null without income. */
  incomeUse: number | null;
}
