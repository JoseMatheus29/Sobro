import { type TransactionRecord } from '@/db/transactions';
import { type CreditUsage } from './creditLimit-type';
import { addMonths } from './month';
import { lastMonthOf, occurrenceIn } from './recurrence';
import { MAX_INSTALLMENTS, type RecurrenceRecord } from './recurrence-type';

const toCents = (value: number) => Math.round(value * 100) / 100;
const sumAbs = (list: TransactionRecord[]) => list.reduce((sum, t) => sum + Math.abs(t.amount), 0);

// How many installments of a plan paid on credit are still to come: the occurrences after the last one the server
// turned into a transaction. A monthly expense with no end has none (the bank does not set a limit aside for it).
export function installmentsToCome(r: RecurrenceRecord): number {
  if (r.paymentMethod !== 'credit' || r.total === null) return 0;
  const last = lastMonthOf(r);
  if (last === null) return 0;
  let count = 0;
  for (let month = addMonths(r.generatedUntil, 1); month <= last && count < MAX_INSTALLMENTS; month = addMonths(month, 1)) {
    if (!occurrenceIn(r, month)) break;
    count += 1;
  }
  return count;
}

// The limit of a card that is still free. `purchases` are what was bought on credit with the account (any month),
// `payments` the payments of its invoices (any month), `recurrences` the recurring expenses (the ones of other
// accounts are ignored). It works the debt out as a whole, not invoice by invoice: what was bought, less what was paid.
export function creditUsage(input: {
  limit: number;
  cardId: number;
  purchases: TransactionRecord[];
  payments: TransactionRecord[];
  recurrences: RecurrenceRecord[];
}): CreditUsage {
  const { limit, cardId } = input;
  const bought = sumAbs(
    input.purchases.filter((t) => t.cardId === cardId && t.type === 'expense' && t.paymentMethod === 'credit' && !t.planned)
  );
  const paid = sumAbs(input.payments.filter((t) => t.cardId === cardId && t.type === 'expense'));
  const owed = toCents(Math.max(0, bought - paid));
  const committed = toCents(
    input.recurrences
      .filter((r) => r.cardId === cardId)
      .reduce((sum, r) => sum + installmentsToCome(r) * r.amount, 0)
  );
  const used = toCents(owed + committed);

  return {
    limit,
    owed,
    committed,
    used,
    available: toCents(limit - used),
    useShare: limit > 0 ? used / limit : 0,
  };
}
