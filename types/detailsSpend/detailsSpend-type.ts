import React from 'react';

import { type ConfirmOptions, type ToastOptions } from '@/types/components/feedback/feedback-type';
import { type CardRecord } from '@/db/cards';
import { type PaymentMethod } from '@/db/transactions';
import { type Category, type TxType } from '@/types/registrationSpent/registrationSpent-type';

export interface DetailRowProps {
  icon: string;
  /** Icon color; the square behind it is the same color, softened. */
  color: string;
  label: string;
  /** Draws no divider under the row. */
  last?: boolean;
  /** When set the row is a button (opens a picker) and shows a chevron. */
  onPress?: () => void;
  children: React.ReactNode;
}

export interface EditFormProps {
  typeColor: string;
  type: TxType;
  setType: (t: TxType) => void;
  /** Digits only, in cents. */
  amount: string;
  setAmount: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  category: Category | null;
  card: CardRecord | null;
  date: Date;
  description: string;
  setDescription: (v: string) => void;
  onPickCategory: () => void;
  onPickCard: () => void;
  onPickDate: () => void;
  /** Only an expense of an account with a credit card has "Como pagou". */
  showPayment: boolean;
  /** Null while the expense says nothing about how it was paid (the old ones). */
  payment: PaymentMethod | null;
  setPayment: (method: PaymentMethod) => void;
}

export const DETAILS_TITLE = 'Detalhes';
export const NOT_FOUND_MESSAGE = 'Transação não encontrada.';
export const SAVE_LABEL = 'Salvar alterações';
export const DELETE_LABEL = 'Excluir transação';
export const SELECT_LABEL = 'Selecionar';

export const FIELD_LABELS = {
  amount: 'Valor',
  name: 'Nome',
  type: 'Tipo',
  category: 'Categoria',
  card: 'Conta',
  date: 'Data',
  payment: 'Como pagou',
  description: 'Descrição',
};
export const NAME_PLACEHOLDER = 'Ex: Almoço no restaurante';
export const DESCRIPTION_PLACEHOLDER = 'Adicione uma observação';
export const AMOUNT_PLACEHOLDER = '0,00';
export const CATEGORY_SHEET_TITLE = 'Categoria';
export const CARD_SHEET_TITLE = 'Conta';

// Soft red behind the delete button, same tint the app uses for the expense icon squares.

export const UPDATED_TITLE = 'Transação atualizada';
export const DELETE_CONFIRM: ConfirmOptions = {
  title: 'Excluir transação?',
  message: 'Esta ação não pode ser desfeita.',
  confirmLabel: 'Excluir',
  destructive: true,
};
export const DELETED_TOAST: ToastOptions = { type: 'success', title: 'Transação excluída', icon: 'delete-outline' };

// Category used when the chosen one does not exist for the other direction ("Outros" exists for both).
export const FALLBACK_CATEGORY_ID = 'other';
export const MISSING_HINT = 'Falta preencher';

// Recurring expenses: what the transaction says about its recurrence, and ending it.
export const RECURRENCE_TITLE = 'Recorrência';
export const RECURRENCE_PER_MONTH = (amount: string) => `${amount} por mês`;
export const RECURRENCE_REMAINING = (remaining: number, total: string) =>
  remaining === 1 ? `Falta 1 parcela · ${total}` : `Faltam ${remaining} parcelas · ${total}`;
export const RECURRENCE_LAST = (month: string) => `Última: ${month}`;
export const RECURRENCE_NO_END = 'Sem data para acabar';
export const RECURRENCE_NEXT = (date: string) => `Próxima em ${date}. Ela já aparece como prevista no mês dela.`;
export const RECURRENCE_ENDED = 'Recorrência encerrada. Nada mais será criado a partir dela.';
export const RECURRENCE_FINISHED = 'Era a última parcela. Nada mais será criado.';
export const END_LABEL = 'Encerrar recorrência';
export const END_HINT = 'As transações já lançadas continuam. Só as próximas deixam de ser criadas.';
export const END_CONFIRM: ConfirmOptions = {
  title: 'Encerrar recorrência?',
  message: 'As próximas deixam de ser criadas e somem dos meses futuros. O que já foi lançado continua.',
  confirmLabel: 'Encerrar',
  destructive: true,
};
export const ENDED_TOAST: ToastOptions = { type: 'success', title: 'Recorrência encerrada', icon: 'event-busy' };
export const APPLY_CONFIRM: ConfirmOptions = {
  title: 'Usar nas próximas também?',
  message: 'Você mudou esta transação. As próximas podem seguir o novo valor, nome, categoria e conta, ou só esta muda.',
  confirmLabel: 'Esta e as próximas',
  cancelLabel: 'Só esta',
};
export const RECURRENCE_ENDED_BY_TYPE = 'Virou uma entrada, então a recorrência foi encerrada.';

// A transfer between accounts: it has no form to edit, only the way to undo it.
export const TRANSFER_TITLE = 'Transferência';
export const TRANSFER_FROM_LABEL = 'Saiu de';
export const TRANSFER_TO_LABEL = 'Foi para';
export const TRANSFER_DATE_LABEL = 'Data';
export const TRANSFER_NOTE_LABEL = 'Descrição';
export const TRANSFER_HINT = 'Uma transferência só muda o saldo das duas contas e não conta como entrada nem como saída.';
export const TRANSFER_DELETE_LABEL = 'Excluir transferência';
export const TRANSFER_DELETE_CONFIRM: ConfirmOptions = {
  title: 'Excluir a transferência?',
  message: 'Os dois lançamentos somem e o saldo das duas contas volta ao que era. Esta ação não pode ser desfeita.',
  confirmLabel: 'Excluir',
  destructive: true,
};
export const TRANSFER_DELETED_TOAST: ToastOptions = { type: 'success', title: 'Transferência excluída', icon: 'delete-outline' };

// The payment of a credit card invoice: it has no form to edit, only the way to undo it.
export const INVOICE_PAYMENT_TITLE = 'Pagamento de fatura';
export const INVOICE_PAYMENT_INVOICE_LABEL = 'Fatura paga';
export const INVOICE_PAYMENT_FROM_LABEL = 'Saiu do saldo de';
export const INVOICE_PAYMENT_DATE_LABEL = 'Data do pagamento';
export const INVOICE_PAYMENT_HINT =
  'Pagar a fatura só tira o dinheiro do saldo: as compras já contaram no mês em que você as fez.';
export const INVOICE_PAYMENT_DELETE_LABEL = 'Desfazer pagamento';
export const INVOICE_PAYMENT_DELETE_CONFIRM: ConfirmOptions = {
  title: 'Desfazer o pagamento?',
  message: 'O valor volta para o saldo da conta e a fatura volta a ficar em aberto. Esta ação não pode ser desfeita.',
  confirmLabel: 'Desfazer',
  destructive: true,
};
export const INVOICE_PAYMENT_DELETED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Pagamento desfeito',
  icon: 'delete-outline',
};
export const INVOICE_PAYMENT_DELETE_FAILED_TITLE = 'Não foi possível desfazer o pagamento';

// What went wrong, in the title of the toast.
export const SAVE_FAILED_TITLE = 'Não foi possível salvar';
export const DELETE_FAILED_TITLE = 'Não foi possível excluir';
export const END_FAILED_TITLE = 'Não foi possível encerrar';
export const TRANSFER_DELETE_FAILED_TITLE = 'Não foi possível desfazer a transferência';
