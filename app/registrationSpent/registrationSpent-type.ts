import { type ViewStyle } from 'react-native';

import { palette } from '@/constants/palette';
import { type CardRecord } from '@/db/cards';

export type TxType = 'expense' | 'income';
export type FlowStep = 1 | 2 | 3;

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

export interface FlowHeaderProps {
  title: string;
  step: FlowStep;
  onBack: () => void;
}

export interface FlowButtonProps {
  label: string;
  type: TxType;
  onPress: () => void;
  disabled?: boolean;
  /** Drops the home-indicator padding while the keyboard is up. */
  compact?: boolean;
}

export interface AmountStepProps {
  type: TxType;
  setType: (t: TxType) => void;
  amount: string;
  setAmount: (v: string) => void;
  typeColor: string;
  onNext: () => void;
}

export interface CategoryStepProps {
  type: TxType;
  categories: Category[];
  selectedCat: string | null;
  amountText: string;
  typeColor: string;
  onPick: (id: string) => void;
  onCategoryCreated: () => void;
}

export interface DetailsStepProps {
  typeColor: string;
  amountText: string;
  category: Category | null;
  nome: string;
  setNome: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  cards: CardRecord[];
  selectedCardId: number | null;
  setSelectedCardId: (id: number) => void;
  date: Date;
  setDate: (d: Date) => void;
  onEditAmount: () => void;
  onEditCategory: () => void;
}

export const TYPE_COLORS: Record<TxType, string> = {
  expense: palette.expense,
  income: palette.income,
};

// Left-to-right gradient of the main button, darkest end first (like the blue default).
export const TYPE_GRADIENTS: Record<TxType, [string, string]> = {
  expense: [palette.expense, '#C0514A'],
  income: [palette.income, '#2F9334'],
};

// Neutral instead of a faded type color, which read as pink and broken.
export const DISABLED_GRADIENT: [string, string] = ['#B8C4D6', '#C9D3E1'];

// White thumb of the saída/entrada toggle; only its text takes the type color.
export const TOGGLE_THUMB_STYLE: ViewStyle = {
  backgroundColor: '#fff',
  shadowColor: palette.ink,
  shadowOpacity: 0.14,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
};

export const TX_TYPE_OPTIONS: { type: TxType; label: string; icon: string }[] = [
  { type: 'expense', label: 'Saída', icon: 'arrow-upward' },
  { type: 'income', label: 'Entrada', icon: 'arrow-downward' },
];

export const STEP_NAMES = ['Valor', 'Categoria', 'Detalhes'];
export const STEP_COUNT = STEP_NAMES.length;

export const TITLES: Record<TxType, string> = { expense: 'Nova saída', income: 'Nova entrada' };
export const CATEGORY_HEADINGS: Record<TxType, string> = {
  expense: 'Em que você gastou?',
  income: 'De onde veio?',
};
export const SAVE_LABELS: Record<TxType, string> = {
  expense: 'Registrar saída',
  income: 'Registrar entrada',
};
export const CONTINUE_LABEL = 'Continuar';
export const NEW_CATEGORY_LABEL = 'Nova categoria';
export const CHANGE_LABEL = 'Alterar';

// Keypad: digits shift in from the right as cents; '00' is a shortcut for two zeros.
export const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];
export const MAX_AMOUNT_DIGITS = 9;

// Default categories that only make sense for one direction. Everything else
// (including categories the user creates, and "Outros") shows for both.
export const CATEGORY_IDS_HIDDEN_FOR: Record<TxType, string[]> = {
  expense: ['salary', 'invest'],
  income: ['food', 'transport', 'leisure', 'health', 'shopping'],
};

// The screen is a sheet over the screen it was opened from.
export const SHEET_TOP_GAP = 16; // below the status bar inset
export const SHEET_DIM_COLOR = 'rgba(26,43,74,0.5)';
export const CLOSE_LABEL = 'Fechar';

export const VALIDATION_MESSAGES = {
  amount: 'Informe o valor da transação.',
  category: 'Selecione uma categoria.',
  card: 'Selecione uma conta.',
  name: 'Informe o nome da transação.',
};
export const SAVED_TITLES: Record<TxType, string> = {
  expense: 'Saída registrada',
  income: 'Entrada registrada',
};
