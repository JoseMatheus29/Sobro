import { type ToastOptions } from '@/types/components/feedback/feedback-type';

export const TRANSFER_TITLE = 'Transferir entre contas';
export const AMOUNT_LABEL = 'Valor';
export const AMOUNT_PLACEHOLDER = '0,00';
export const FROM_LABEL = 'De';
export const TO_LABEL = 'Para';
export const SELECT_LABEL = 'Selecionar';
export const FROM_SHEET_TITLE = 'Sai de qual conta?';
export const TO_SHEET_TITLE = 'Vai para qual conta?';
export const DATE_LABEL = 'Data';
export const DESCRIPTION_LABEL = 'Descrição (opcional)';
export const DESCRIPTION_PLACEHOLDER = 'Ex: reserva do mês';
export const SWAP_LABEL = 'Inverter as contas';
export const SUBMIT_LABEL = (amount: string) => (amount ? `Transferir R$ ${amount}` : 'Transferir');
export const HINT = 'Não conta como entrada nem como saída: só muda o saldo das duas contas.';
export const NEED_TWO_ACCOUNTS = 'Cadastre outra conta na Carteira para poder transferir entre elas.';

export const INVALID_AMOUNT_TOAST: ToastOptions = { type: 'error', title: 'Informe um valor maior que zero.' };
export const SAME_ACCOUNT_TOAST: ToastOptions = { type: 'error', title: 'Escolha duas contas diferentes.' };
export const TRANSFERRED_TOAST = (amount: string, from: string, to: string): ToastOptions => ({
  type: 'success',
  title: 'Transferência feita',
  message: `R$ ${amount} de ${from} para ${to}`,
  icon: 'swap-horiz',
});

export const TRANSFER_FAILED_TITLE = 'Não foi possível transferir';
