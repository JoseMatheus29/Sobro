import { type PaymentMethod } from '@/db/transactions';

// "Como pagou": Pix and debit leave the account's balance at once; credit goes into the invoice of the card and
// only leaves the balance when the invoice is paid.
export const PAYMENT_TITLE = 'Como pagou';

export const PAYMENT_OPTIONS: { method: PaymentMethod; label: string }[] = [
  { method: 'pix', label: 'Pix' },
  { method: 'debit', label: 'Débito' },
  { method: 'credit', label: 'Crédito' },
];

// What a new expense starts as, on an account that has a credit card.
export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'pix';

export const PAYMENT_BALANCE_HINT = 'Sai do saldo da conta na hora.';
export const PAYMENT_CREDIT_HINT = (invoice: string, closes: string, due: string) =>
  `Entra na fatura de ${invoice}, que fecha em ${closes} e vence em ${due}. O saldo da conta não muda agora.`;
export const PAYMENT_CREDIT_INSTALLMENTS_HINT = (invoice: string) =>
  `A 1ª parcela entra na fatura de ${invoice} e cada parcela cai numa fatura. O saldo da conta não muda agora.`;
// Shown in the edit form, where the expense may already be in an invoice.
export const PAYMENT_EDIT_HINT = 'Mudar para Pix ou débito tira a compra da fatura e passa a descontar do saldo.';

// The short label of the invoice a purchase went into, on the lists.
export const INVOICE_TAG = (shortMonth: string) => `Fatura ${shortMonth}`;
