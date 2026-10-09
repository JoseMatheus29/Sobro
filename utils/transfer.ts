import { type TransactionRecord } from '@/db/transactions';

// A transfer moves money between two accounts: its two legs change the balances, but they are neither
// income nor expense, so everything that adds up a month leaves them out.
export function isTransfer(t: Pick<TransactionRecord, 'transferId'>): boolean {
  return t.transferId !== undefined && t.transferId !== null;
}

export function withoutTransfers<T extends Pick<TransactionRecord, 'transferId'>>(list: T[]): T[] {
  return list.filter((t) => !isTransfer(t));
}
