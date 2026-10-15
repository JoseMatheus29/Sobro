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

export interface ApiCard {
  id: number;
  name: string;
  number: string;
  color: string;
  lightColor: string;
  /** Current balance: starting balance plus its transactions. */
  balance: number;
  startingBalance: number;
}

export interface CardInput {
  name: string;
  number?: string;
  color: string;
  lightColor: string;
  startingBalance?: number;
}

export type CardPatch = Partial<Pick<CardInput, 'name' | 'number' | 'color' | 'lightColor'>>;

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
