import { INVOICE_CATEGORY_ID } from '@/utils/invoice-type';
import { type InvoiceRules } from '@/utils/invoice-type';
import { cycleMonths } from '@/utils/invoice';

import { getTransactions, type TransactionRecord } from './transactions';

// What an invoice is worked out from: what was bought on credit in its cycle (read by the calendar months it
// touches), and every payment of an invoice of this card. The invoice itself is not on the server: see
// utils/invoice.ts for how it is put together.
export async function getInvoiceSources(
  cardId: number,
  month: string,
  rules: InvoiceRules
): Promise<{ purchases: TransactionRecord[]; payments: TransactionRecord[] }> {
  const [byMonth, payments] = await Promise.all([
    Promise.all(cycleMonths(month, rules).map((m) => getTransactions({ cardId, month: m, paymentMethod: 'credit' }))),
    getTransactions({ cardId, categoryId: INVOICE_CATEGORY_ID }),
  ]);
  return { purchases: byMonth.flat(), payments };
}

// Everything bought on credit with an account and every payment of its invoices, of any month: what the limit of the
// card is worked out from (utils/creditLimit.ts). `own` reads the person's own whatever profile is open (the reminders).
export async function getCreditHistory(
  cardId: number,
  options: { own?: boolean } = {}
): Promise<{ purchases: TransactionRecord[]; payments: TransactionRecord[] }> {
  const [purchases, payments] = await Promise.all([
    getTransactions({ cardId, paymentMethod: 'credit' }, options),
    getTransactions({ cardId, categoryId: INVOICE_CATEGORY_ID }, options),
  ]);
  return { purchases, payments };
}
