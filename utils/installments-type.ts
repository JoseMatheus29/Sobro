import { type InvoiceRules } from './invoice-type';

export interface InstallmentPlanInput {
  /** 'YYYY-MM-DD': the day of the purchase, as the person remembers it. */
  purchaseDay: string;
  total: number;
  /** The installment the person is paying now (1 for a purchase made today). */
  current: number;
  /** The card's days when it is paid on credit: the plan is then placed in invoices. Null: it is placed in months. */
  rules: InvoiceRules | null;
  /** 'YYYY-MM-DD' of today on the phone. */
  today: string;
}

export interface InstallmentPlan {
  current: number;
  total: number;
  /** The day of the installment the person is on: the one that is registered. */
  firstDay: string;
  /** The day of the last installment. */
  lastDay: string;
  /** 'YYYY-MM' of the month the invoice is due in (on credit; how it is called) or of the month (otherwise). */
  firstPeriod: string;
  /** The same for the last installment. */
  lastPeriod: string;
  /** How many installments came before the one registered: they are not in the app. */
  skipped: number;
  onCredit: boolean;
  /** The installment registered is in an invoice (or month) after the open one: the person cannot be on it yet. */
  notYet: boolean;
}
