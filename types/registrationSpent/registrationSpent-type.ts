import { type ViewStyle } from 'react-native';

import { palette, type Palette } from '@/constants/palette';
import { type CardRecord } from '@/db/cards';
import { type PaymentMethod } from '@/db/transactions';
import { type InstallmentPlan } from '@/utils/installments-type';
import { type RepeatMode } from '@/utils/recurrence-type';

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
  /** The profile of someone else this is being registered in; absent for the person's own. */
  forName?: string;
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
  /** Only an expense can repeat. */
  type: TxType;
  /** The amount in reais, for the summary of the repetition. */
  amountValue: number;
  repeat: RepeatMode;
  setRepeat: (mode: RepeatMode) => void;
  installments: number;
  setInstallments: (n: number) => void;
  currentInstallment: number;
  setCurrentInstallment: (n: number) => void;
  /** How it was paid; only asked on an expense of an account that has a credit card. */
  payment: PaymentMethod;
  setPayment: (method: PaymentMethod) => void;
}

export interface RepeatSectionProps {
  amountValue: number;
  date: Date;
  /** Where the installments land, worked out from the day of the purchase; null unless it is an installment plan. */
  plan: InstallmentPlan | null;
  repeat: RepeatMode;
  setRepeat: (mode: RepeatMode) => void;
  installments: number;
  setInstallments: (n: number) => void;
  currentInstallment: number;
  setCurrentInstallment: (n: number) => void;
}

// The color of each type as text and icons on the active theme.
export const typeColors = (colors: Palette): Record<TxType, string> => ({
  expense: colors.expense,
  income: colors.income,
});

// Left-to-right gradient of the main button (white text on top), darkest end first: fixed in both themes.
export const TYPE_GRADIENTS: Record<TxType, [string, string]> = {
  expense: [palette.expense, '#C0514A'],
  income: [palette.income, '#2F9334'],
};

// Thumb of the saída/entrada toggle; only its text takes the type color.
export const toggleThumbStyle = (colors: Palette): ViewStyle => ({
  backgroundColor: colors.thumb,
  shadowColor: colors.ink,
  shadowOpacity: 0.14,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
});

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
  expense: ['salary', 'invest', 'transfer', 'invoice'],
  income: ['food', 'transport', 'leisure', 'health', 'shopping', 'transfer', 'invoice'],
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

// Repeating an expense: every month, or in installments.
export const REPEAT_TITLE = 'Repetir';
export const REPEAT_OPTIONS: { mode: RepeatMode; label: string }[] = [
  { mode: 'none', label: 'Não repete' },
  { mode: 'monthly', label: 'Todo mês' },
  { mode: 'installments', label: 'Parcelado' },
];
export const INSTALLMENTS_LABEL = 'Parcelas';
export const CURRENT_INSTALLMENT_LABEL = 'Estou na parcela';
export const MONTHLY_SUMMARY_TITLE = (day: number) => `Todo mês, no dia ${day}`;
export const MONTHLY_SUMMARY_TEXT = 'Sem data para acabar. Você pode encerrar quando quiser, nos detalhes da transação.';
export const INSTALLMENT_SUMMARY_TITLE = (remaining: number, amount: string) =>
  remaining === 1 ? `1 parcela restante de ${amount}` : `${remaining} parcelas restantes de ${amount}`;
export const INSTALLMENT_SUMMARY_TEXT = (total: string, schedule: string) =>
  `Total a pagar ${total}. ${schedule} As próximas aparecem como previstas.`;
// With a plan, the date is the one of the purchase: the app works out the day of the installment the person is on.
export const INSTALLMENT_DATE_LABEL = 'Data da compra';
// Where the installment the person is on and the last one land: in invoices on credit, in months otherwise.
export const INSTALLMENT_SCHEDULE_TEXT = (p: {
  current: number;
  total: number;
  first: string;
  last: string;
  onCredit: boolean;
}) => {
  const where = (name: string) => (p.onCredit ? `na fatura de ${name}` : `em ${name}`);
  return p.current === p.total
    ? `A parcela ${p.current}/${p.total}, a última, cai ${where(p.first)}.`
    : `A parcela ${p.current}/${p.total} cai ${where(p.first)} e a última (${p.total}/${p.total}), ${p.onCredit ? 'na de' : 'em'} ${p.last}.`;
};
export const INSTALLMENT_SKIPPED_TEXT = (skipped: number) =>
  skipped === 1 ? 'A parcela 1 já passou e não entra no app.' : `As parcelas 1 a ${skipped} já passaram e não entram no app.`;
export const INSTALLMENT_NOT_YET_TITLE = 'Essa parcela ainda não chegou';
export const INSTALLMENT_NOT_YET_MESSAGE = (current: number, first: string, onCredit: boolean) =>
  `A parcela ${current} só cai ${onCredit ? `na fatura de ${first}, que ainda não abriu` : `em ${first}`}. Confira a data da compra e a parcela em que você está.`;
export const CREDIT_TOAST_SUFFIX = (invoice: string) => `na fatura de ${invoice}`;
export const REPEATING_TOAST_SUFFIX = {
  monthly: 'repete todo mês',
  installments: 'parcelado',
};

// Error of the new-category dialog (shown inside it).
export const CATEGORY_SAVE_FAILED_MESSAGE = 'Não foi possível criar a categoria.';
export const SAVE_FAILED_TITLE = 'Não foi possível salvar';
