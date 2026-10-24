import { type CardRecord } from '@/db/cards';
import { type TransactionRecord } from '@/db/transactions';
import { INVOICE_TAG } from '@/types/components/ui/payment-type';
import { dayOf, invoiceShortNameOf } from './invoice';

// The tag on a list row of a purchase on credit: the invoice it goes into, called by the month it is due in ("Fatura
// dez"). Undefined for anything else, and for an account whose card days are not known.
export function invoiceTagOf(
  t: Pick<TransactionRecord, 'occurredAt' | 'paymentMethod' | 'cardId'>,
  cards: CardRecord[]
): string | undefined {
  if (t.paymentMethod !== 'credit') return undefined;
  const rules = cards.find((c) => c.id === t.cardId)?.credit;
  return rules ? INVOICE_TAG(invoiceShortNameOf(dayOf(t.occurredAt), rules)) : undefined;
}
