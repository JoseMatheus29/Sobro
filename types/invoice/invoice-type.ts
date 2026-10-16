import { type InvoiceStatus } from '@/utils/invoice-type';

export const INVOICE_SCREEN_TITLE = 'Fatura';
export const invoiceTitle = (monthName: string) => `Fatura de ${monthName}`;

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  overdue: 'Vencida',
  paid: 'Paga',
};

export const CYCLE_TEXT = (opens: string, closes: string) => `Ciclo de ${opens} a ${closes}`;
export const CLOSES_TEXT = (days: number) =>
  days <= 0 ? 'fecha hoje' : days === 1 ? 'fecha amanhã' : `fecha em ${days} dias`;
export const DUE_TEXT = (due: string, days: number) =>
  days < 0 ? `venceu em ${due}` : days === 0 ? 'vence hoje' : days === 1 ? 'vence amanhã' : `vence em ${due}`;
export const CLOSES_AND_DUE = (closes: string, due: string) => `Fecha ${closes} · vence ${due}`;
export const REMAINING_TEXT = (amount: string) => `Falta pagar ${amount}`;
export const PAID_TEXT = (amount: string) => `Já pago ${amount}`;
export const PLANNED_NOTE = (amount: string) => `Inclui ${amount} previstos de parcelas e recorrências.`;
export const NOTHING_TO_PAY_TEXT = 'Nada a pagar nesta fatura.';

export const PURCHASES_TITLE = 'Compras desta fatura';
export const PURCHASES_COUNT = (n: number) => (n === 1 ? '1 compra' : `${n} compras`);
export const EMPTY_PURCHASES = 'As compras no crédito desta fatura aparecem aqui';
export const PAYMENTS_TITLE = 'Pagamentos';

export const PAY_ACTION = 'Pagar fatura';
export const VIEW_ACTION = 'Ver fatura';
export const PREVIOUS_MONTH_LABEL = 'Fatura anterior';
export const NEXT_MONTH_LABEL = 'Próxima fatura';
export const NO_CREDIT_MESSAGE = 'Esta conta não tem cartão de crédito.';

// A closed invoice still waiting for its payment, on the Carteira.
export const PREVIOUS_UNPAID = (monthName: string, amount: string) => `Fatura de ${monthName} fechada: ${amount} para pagar`;
