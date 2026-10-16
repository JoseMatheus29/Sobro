import { type ToastOptions } from '@/types/components/feedback/feedback-type';

export const PAY_TITLE = 'Pagar fatura';
export const AMOUNT_LABEL = 'Valor a pagar';
export const AMOUNT_PLACEHOLDER = '0,00';
export const FULL_LABEL = 'Valor total';
export const OTHER_LABEL = 'Outro valor';
export const FROM_LABEL = 'Sai do saldo de';
export const DATE_LABEL = 'Data do pagamento';
export const BALANCE_AFTER_LABEL = 'Saldo da conta depois';
export const HINT =
  'O valor sai do saldo e abate a fatura. Não entra como gasto de novo: as compras já contaram no dia em que você as fez.';
export const SUBMIT_LABEL = (amount: string) => (amount ? `Pagar R$ ${amount}` : 'Pagar fatura');
export const NOTHING_TO_PAY = 'Esta fatura não tem nada a pagar.';

export const INVALID_AMOUNT_TOAST: ToastOptions = { type: 'error', title: 'Informe um valor maior que zero.' };
export const TOO_MUCH_TOAST = (remaining: string): ToastOptions => ({
  type: 'error',
  title: `Só faltam ${remaining} para pagar nesta fatura.`,
});
export const PAID_TOAST = (amount: string, monthName: string): ToastOptions => ({
  type: 'success',
  title: 'Fatura paga',
  message: `R$ ${amount} da fatura de ${monthName}`,
  icon: 'credit-score',
});
export const PAY_FAILED_TITLE = 'Não foi possível pagar a fatura';
