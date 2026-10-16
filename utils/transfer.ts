import { type TransactionRecord } from '@/db/transactions';
import { INVOICE_CATEGORY_ID } from './invoice-type';

// A transfer moves money between two accounts: its two legs change the balances, but they are neither
// income nor expense, so everything that adds up a month leaves them out.
export function isTransfer(t: Pick<TransactionRecord, 'transferId'>): boolean {
  return t.transferId !== undefined && t.transferId !== null;
}

// The payment of a credit card invoice leaves the account's balance, but it is no spending: what was bought with
// the card was already counted on the day of each purchase.
export function isInvoicePayment(t: Partial<Pick<TransactionRecord, 'categoryId'>>): boolean {
  return t.categoryId === INVOICE_CATEGORY_ID;
}

// What only moves money (between accounts, or from the account to its card): shown without the color of an
// income or an expense, and left out of every sum of a month.
export function isMoneyMove(t: Pick<TransactionRecord, 'transferId'> & Partial<Pick<TransactionRecord, 'categoryId'>>): boolean {
  return isTransfer(t) || isInvoicePayment(t);
}

// The name is the old one: it leaves out the payments of invoices too.
export function withoutTransfers<T extends Pick<TransactionRecord, 'transferId'> & Partial<Pick<TransactionRecord, 'categoryId'>>>(
  list: T[]
): T[] {
  return list.filter((t) => !isMoneyMove(t));
}
