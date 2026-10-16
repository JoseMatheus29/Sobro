// What the API sends and takes, as written in the mobile guide (api-rotas-e-consumo-mobile.md). The screens
// keep using the records of db/ (TransactionRecord, CardRecord…); these are the wire shapes behind them.
//
// Amounts: a transaction comes back signed (an expense is negative) but goes out as a positive magnitude, and
// only a caixinha movement goes out signed. Dates of a transaction are calendar days at noon UTC.

import { type FieldIssue } from './errors';

export type { FieldIssue };

// ---- session ----

export interface AuthUser {
  id: string;
  email: string;
}

/** Answer of register and login. */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  /** Seconds the access token lasts. */
  expiresIn: number;
  user: AuthUser;
}

/** Answer of refresh: no user. */
export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ---- profile ----

export interface ApiProfile {
  id: string;
  email: string;
  name: string;
  currency: string;
  remindersEnabled: boolean;
}

export interface ProfilePatch {
  name?: string;
  currency?: string;
  remindersEnabled?: boolean;
}

// ---- categories ----

export interface ApiCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  /** True for the ones the person made; false for the catalog. */
  custom: boolean;
}

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  bg: string;
}

// ---- accounts ----

/** How a purchase was paid. Only 'credit' stays out of the balance: it goes to the invoice. */
export type ApiPaymentMethod = 'pix' | 'debit' | 'credit';

/** The credit card of an account: when its invoice closes and falls due. */
export interface ApiCardCredit {
  /** The card's limit, when the person says it. */
  limit: number | null;
  /** 1 to 31; a shorter month uses its last day. */
  closingDay: number;
  dueDay: number;
}

export interface ApiCard {
  id: number;
  name: string;
  number: string;
  color: string;
  lightColor: string;
  /** Current balance: starting balance plus its transactions, leaving out what was bought on credit. */
  balance: number;
  startingBalance: number;
  /** Null for an account without a credit card. Absent from a server that does not know cards yet. */
  credit?: ApiCardCredit | null;
}

export interface CardInput {
  name: string;
  number?: string;
  color: string;
  lightColor: string;
  startingBalance?: number;
  credit?: ApiCardCredit;
}

export type CardPatch = Partial<Pick<CardInput, 'name' | 'number' | 'color' | 'lightColor'>> & {
  /** Null takes the credit card off the account (409 `credit_in_use` while it has purchases). */
  credit?: ApiCardCredit | null;
};

export interface CardUsage {
  transactions: number;
  recurrences: number;
}

// ---- transactions ----

export type ApiTransactionType = 'income' | 'expense';

export interface ApiTransaction {
  id: number;
  cardId: number;
  cardName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  name: string;
  description: string | null;
  /** Signed: negative for an expense. */
  amount: number;
  type: ApiTransactionType;
  occurredAt: string;
  createdAt: string;
  recurrence: { id: number; installment: number | null; total: number | null } | null;
  transferId: number | null;
  /** Null for what leaves the balance without saying how (the old ones), and for incomes. */
  paymentMethod?: ApiPaymentMethod | null;
  /** 'YYYY-MM' of the invoice, only on the payment of an invoice. */
  invoiceMonth?: string | null;
}

export interface TransactionPage {
  items: ApiTransaction[];
  /** Pass it back, with the same filters, to get the next page; null on the last one. */
  nextCursor: string | null;
}

export interface TransactionQuery {
  month?: string;
  cardId?: number;
  categoryId?: string;
  type?: ApiTransactionType;
  paymentMethod?: ApiPaymentMethod;
  q?: string;
  limit?: number;
  cursor?: string;
}

export type RepeatInput = { mode: 'monthly' } | { mode: 'installments'; total: number; current?: number };

export interface TransactionInput {
  cardId: number;
  categoryId: string;
  name: string;
  description?: string;
  /** Positive: the type gives it its sign. */
  amount: number;
  type: ApiTransactionType;
  occurredAt: string;
  /** Only for an expense. */
  repeat?: RepeatInput;
  /** Only for an expense; 'credit' needs an account with a credit card. */
  paymentMethod?: ApiPaymentMethod;
}

export interface TransactionPatch {
  cardId?: number;
  categoryId?: string;
  name?: string;
  description?: string | null;
  amount?: number;
  type?: ApiTransactionType;
  occurredAt?: string;
  /** Also change the recurrence this one came from, so the next ones come out the same. */
  applyToNext?: boolean;
  paymentMethod?: ApiPaymentMethod | null;
}

export interface TransferInput {
  fromCardId: number;
  toCardId: number;
  amount: number;
  description?: string;
  occurredAt: string;
}

export interface TransferResult {
  transferId: number;
  /** The leg that left, then the one that came in. */
  legs: [ApiTransaction, ApiTransaction];
}

// ---- recurrences ----

export interface ApiRecurrence {
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
  day: number;
  startMonth: string;
  firstInstallment: number;
  total: number | null;
  endMonth: string | null;
  generatedUntil: string;
  paymentMethod?: ApiPaymentMethod | null;
}

// ---- credit card invoices ----

/** Pays (part of) an invoice with the balance of the same account. */
export interface InvoicePaymentInput {
  /** The invoice: 'YYYY-MM' of the month it closes in (utils/invoice.ts). */
  month: string;
  /** Positive. */
  amount: number;
  /** The calendar day of the payment, at noon UTC. */
  occurredAt: string;
}

// ---- caixinhas ----

export interface ApiGoal {
  id: number;
  name: string;
  targetAmount: number;
  targetMonth: string | null;
  color: string;
  icon: string;
  saved: number;
}

export interface GoalInput {
  name: string;
  targetAmount: number;
  targetMonth?: string | null;
  color: string;
  icon: string;
}

export type GoalPatch = Partial<GoalInput>;

export interface ApiGoalEntry {
  id: number;
  goalId: number;
  /** Signed: positive puts money in, negative takes it out. */
  amount: number;
  occurredAt: string;
}

export interface GoalEntryInput {
  /** Signed, and not zero. */
  amount: number;
  /** An instant; the server uses "now" without it. */
  occurredAt?: string;
}

// ---- budgets ----

export interface ApiMonthlyBudget {
  /** 'YYYY-MM' it applies from; '0000-00' is the one carried over from the first version. */
  month: string;
  /** Null: no budget from that month on. */
  amount: number | null;
}

export interface ApiCategoryBudget {
  categoryId: string;
  month: string;
  amount: number | null;
}

// ---- reports ----

export interface ApiMonthlyTotal {
  month: string;
  income: number;
  expense: number;
}

export interface ApiCategoryTotal {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  bg: string;
  total: number;
}
