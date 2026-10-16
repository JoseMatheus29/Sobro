import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import {
  type ApiCategoryTotal,
  type ApiPaymentMethod,
  type InvoicePaymentInput,
  type ApiMonthlyTotal,
  type ApiTransaction,
  type TransactionInput,
  type TransactionPage,
  type TransactionPatch,
  type TransferInput,
  type TransferResult,
} from '@/api/types';
import { TRANSACTIONS_MAX_PAGES, TRANSACTIONS_PAGE_SIZE } from '@/types/api/api-type';
import { type MonthTotals } from '@/utils/history-type';
import { INVOICE_CATEGORY_ID } from '@/utils/invoice-type';
import { buildQuery } from '@/utils/queryString';

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = ApiPaymentMethod;

// Set on the transactions that come from a recurring expense (see utils/recurrence.ts).
export interface TransactionRecurrence {
  id: number;
  /** Number of this payment in its plan; null for a plain monthly one. */
  installment: number | null;
  /** Payments in the plan; null for a plain monthly one. */
  total: number | null;
}

export interface TransactionRecord {
  id: number;
  cardId: number;
  cardName: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  name: string;
  description: string | null;
  amount: number; // always signed: negative = expense, positive = income
  type: TransactionType;
  occurredAt: string; // ISO 8601: the calendar day, at noon UTC
  createdAt: string;
  recurrence?: TransactionRecurrence | null;
  /** True for a calculated row of a month that has not started: it is not on the server. */
  planned?: boolean;
  /** Shared by the two legs of a transfer between accounts; null for an ordinary transaction. */
  transferId?: number | null;
  /** How it was paid; null for the ones that just leave the balance (the old ones) and for incomes. */
  paymentMethod?: PaymentMethod | null;
  /** 'YYYY-MM' of the invoice it pays; only on the payment of an invoice. */
  invoiceMonth?: string | null;
}

export interface TransactionFilters {
  cardId?: number;
  /** 'YYYY-MM', matches transactions occurring in that month */
  month?: string;
  categoryId?: string;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  /** Words that have to be in the name, the description, the category or the account (accents and case ignored). */
  q?: string;
  /** Newest first, so this keeps the most recent N. Without it, every page is read. */
  limit?: number;
}

const NOT_FOUND = 404;
// The server takes up to 100 characters of text to look for.
const SEARCH_MAX_LENGTH = 100;

function toRecord(t: ApiTransaction): TransactionRecord {
  return {
    id: t.id,
    cardId: t.cardId,
    cardName: t.cardName,
    categoryId: t.categoryId,
    categoryName: t.categoryName,
    categoryIcon: t.categoryIcon,
    categoryColor: t.categoryColor,
    name: t.name,
    description: t.description,
    amount: t.amount,
    type: t.type,
    occurredAt: t.occurredAt,
    createdAt: t.createdAt,
    recurrence: t.recurrence,
    transferId: t.transferId,
    paymentMethod: t.paymentMethod ?? null,
    invoiceMonth: t.invoiceMonth ?? null,
  };
}

// Newest first. The server answers in pages (`nextCursor`), and every page is read unless a `limit` says how many
// are wanted. The recurring expenses that fell due are made by the server as it reads.
export async function getTransactions(filters: TransactionFilters = {}): Promise<TransactionRecord[]> {
  const { limit, q, ...rest } = filters;
  const wanted = limit !== undefined ? Math.max(0, Math.floor(limit)) : Infinity;
  if (wanted === 0) return [];

  const items: TransactionRecord[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < TRANSACTIONS_MAX_PAGES; page += 1) {
    const size = Math.min(wanted - items.length, TRANSACTIONS_PAGE_SIZE);
    const result = await api<TransactionPage>(
      'GET',
      `/v1/transactions${buildQuery({ ...rest, q: q?.trim().slice(0, SEARCH_MAX_LENGTH), limit: size, cursor })}`
    );
    items.push(...result.items.map(toRecord));
    if (!result.nextCursor || items.length >= wanted) break;
    cursor = result.nextCursor;
  }
  return items.slice(0, wanted);
}

// Null when it does not exist (anymore), or is not the person's.
export async function getTransactionById(id: number): Promise<TransactionRecord | null> {
  try {
    return toRecord(await api<ApiTransaction>('GET', `/v1/transactions/${id}`));
  } catch (error) {
    if (isApiError(error) && error.status === NOT_FOUND) return null;
    throw error;
  }
}

export type NewTransaction = TransactionInput;

// `amount` is the positive magnitude: the type gives it its sign. The date is the calendar day at noon UTC (see
// utils/apiInput.ts). With `repeat` this is the first occurrence of a recurring expense, and the server makes the
// rest as they fall due. `idempotencyKey` keeps a retry after a lost answer from making two.
export async function createTransaction(input: NewTransaction, idempotencyKey?: string): Promise<TransactionRecord> {
  return toRecord(await api<ApiTransaction>('POST', '/v1/transactions', { body: input, idempotencyKey }));
}

// `applyToNext` also changes the recurrence the transaction came from, so the next ones come out the same. Turning a
// recurring expense into an income ends the recurrence (the server does it).
export async function updateTransaction(id: number, patch: TransactionPatch): Promise<TransactionRecord> {
  return toRecord(await api<ApiTransaction>('PATCH', `/v1/transactions/${id}`, { body: patch }));
}

// Deleting one leg of a transfer deletes both. Gone already (a retry of a delete that worked) is what was asked for.
export async function deleteTransaction(id: number): Promise<void> {
  try {
    await api('DELETE', `/v1/transactions/${id}`);
  } catch (error) {
    if (!(isApiError(error) && error.status === NOT_FOUND)) throw error;
  }
}

export const TRANSFER_CATEGORY_ID = 'transfer';
// The hidden category of the payment of a credit card invoice: it moves the balance but is not a spending.
export { INVOICE_CATEGORY_ID };

// Pays (part of) an invoice with the balance of the account that has the card. It is an expense of the account in
// the hidden "invoice" category, so it changes the balance and counts as no month's spending (the purchases were
// counted the day they were made). Undone by deleting the transaction. `idempotencyKey` keeps a retry from paying twice.
export async function payInvoice(
  cardId: number,
  input: InvoicePaymentInput,
  idempotencyKey?: string
): Promise<TransactionRecord> {
  return toRecord(
    await api<ApiTransaction>('POST', `/v1/cards/${cardId}/invoice-payments`, { body: input, idempotencyKey })
  );
}

// Moves money from one account to another: an expense in the first and an income in the second, tied by a
// `transferId`. Both change the balances, but neither counts as the month's income or expense.
export function createTransfer(input: TransferInput, idempotencyKey?: string): Promise<TransferResult> {
  return api<TransferResult>('POST', '/v1/transfers', { body: input, idempotencyKey });
}

// Both legs of a transfer, the one that left first. The server has no route by transfer, but the two legs share
// their date, so they are both in the transfers of that month.
export async function getTransferLegs(transferId: number, month: string): Promise<TransactionRecord[]> {
  const inMonth = await getTransactions({ month, categoryId: TRANSFER_CATEGORY_ID });
  return inMonth
    .filter((t) => t.transferId === transferId)
    .sort((a, b) => (a.type === b.type ? a.id - b.id : a.type === 'expense' ? -1 : 1));
}

// Deleting a transfer takes away both legs, or the balances would be left wrong: the server does it from either one.
export const deleteTransfer = deleteTransaction;

// What each month with transactions took in and put out, for the history. Transfers between accounts are neither.
export function getMonthlyTotals(): Promise<MonthTotals[]> {
  return api<ApiMonthlyTotal[]>('GET', '/v1/reports/monthly-totals');
}

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  bg: string;
  total: number; // positive magnitude of expenses
}

// The expenses of a month by category, the biggest first (no transfers).
export function getCategoryTotals(filters: { month: string }): Promise<CategoryTotal[]> {
  return api<ApiCategoryTotal[]>('GET', `/v1/reports/category-totals${buildQuery({ month: filters.month })}`);
}
