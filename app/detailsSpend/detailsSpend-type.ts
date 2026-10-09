import React from 'react';

import { type ConfirmOptions, type ToastOptions } from '../components/feedback/feedback-type';
import { type CardRecord } from '@/db/cards';
import { type Category, type TxType } from '../registrationSpent/registrationSpent-type';

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
  description: 'Descrição',
};
export const NAME_PLACEHOLDER = 'Ex: Almoço no restaurante';
export const DESCRIPTION_PLACEHOLDER = 'Adicione uma observação';
export const AMOUNT_PLACEHOLDER = '0,00';
export const CATEGORY_SHEET_TITLE = 'Categoria';
export const CARD_SHEET_TITLE = 'Conta';

// Soft red behind the delete button, same tint the app uses for the expense icon squares.
export const DELETE_BUTTON_BG = 'rgba(168,54,54,0.1)';

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
