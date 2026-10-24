import { type Palette } from '@/constants/palette';
import { type PaymentKind, type PaymentSplit } from '@/utils/spending-type';

export interface PieDataItem {
  value: number;
  color: string;
  label: string;
}

export interface MonthlyProgressProps {
  totalGastos: number;
  progress: number;
  percentage: number;
  hasBudget: boolean;
  /** The month's budget ceiling, when there is one. */
  budget: number | null;
  /** The account being looked at, when it is not all of them: the budget is for the whole account, so it is left out. */
  scopeName?: string | null;
}

export interface PaymentSplitCardProps {
  split: PaymentSplit;
}

export interface AccountFilterProps {
  accounts: { id: number; name: string }[];
  /** Null is "Todas". */
  selectedId: number | null;
  onSelect: (id: number | null) => void;
}

// Single neutral slice so the donut keeps its shape when there is nothing to plot.
export const emptyPieData = (colors: Palette): PieDataItem[] => [{ value: 100, color: colors.line, label: '' }];

export const EMPTY_CHART_TITLE = 'Nenhum gasto neste mês';
export const EMPTY_CHART_HINT = 'Toque em + para registrar seu primeiro gasto.';
export const EMPTY_TRANSACTIONS_MESSAGE = 'Seus gastos do mês aparecem aqui';

// What the month's budget has left, in one line under the total.
export const BUDGET_PASSED = (over: string, budget: string) => `Passou ${over} do teto de ${budget}`;
export const BUDGET_USED = (percent: number, budget: string) => `${percent}% do teto de ${budget}`;
export const NO_BUDGET_HINT = 'Defina um orçamento mensal no seu perfil';

// The account filter and how the month's spending was paid (a line that opens into the figures).
export const ALL_ACCOUNTS_LABEL = 'Todas';
export const PAYMENT_SPLIT_TITLE = 'Como você pagou';
export const PAYMENT_SPLIT_LABELS: Record<PaymentKind, string> = {
  pix: 'Pix',
  debit: 'Débito',
  credit: 'Crédito',
  other: 'Sem forma informada',
};
export const PAYMENT_SPLIT_CREDIT_HINT = 'O crédito entra na fatura e só sai do saldo quando você a paga.';

// The color of each slice on the active theme.
export const paymentColors = (colors: Palette): Record<PaymentKind, string> => ({
  pix: colors.expense,
  debit: colors.warning,
  credit: colors.primary.DEFAULT,
  other: colors.subtle,
});

// The spending of the month by category, with the limit of each in force in the month shown.
export interface CategoryRow {
  categoryId: string;
  name: string;
  color: string;
  spent: number;
  /** The limit in force in the month shown; null when there is none. */
  limit: number | null;
}

export interface CategorySectionProps {
  rows: CategoryRow[];
  /** What was spent in all of them: the donut and the percentages are shares of it. */
  total: number;
  /** A limit is for a category in the whole account, so it only shows (and is set) with every account in view. */
  showLimits: boolean;
  /** Limits are set from the current month on, so only the current month can be edited. */
  canEdit: boolean;
  onPressRow: (categoryId: string) => void;
  onAddLimit: () => void;
}

// How many of the biggest categories the legend names before "mais N".
export const LEGEND_SHOWN = 3;

export const CATEGORY_SECTION_TITLE = 'Por categoria';
export const LEGEND_MORE = (count: number) => `mais ${count}`;
export const LIMIT_ALERT_ONE = (name: string) => `${name} passou do limite`;
export const LIMIT_ALERT_MANY = (count: number) => `${count} categorias passaram do limite`;
export const EXPAND_CATEGORIES = (count: number) => (count > 1 ? `Ver as ${count} categorias` : 'Ver detalhes');
export const COLLAPSE_LABEL = 'Mostrar menos';
export const LIMIT_LEFT = (left: string, limit: string) => `Sobram ${left} do limite de ${limit}`;
export const LIMIT_OVER = (over: string, limit: string) => `Passou ${over} do limite de ${limit}`;
export const EDIT_LIMIT_HINT = 'Toque para definir ou mudar o limite';

// The month's spending, one day at a time.
export const TRANSACTIONS_TITLE = 'Seus gastos';
export const SHOW_MORE_TRANSACTIONS = 'Mostrar mais lançamentos';
export const SHOW_LESS_TRANSACTIONS = 'Mostrar menos';
// How many entries the list shows before "Mostrar mais".
export const TRANSACTIONS_INITIAL = 5;

export interface DayListItem {
  id: number;
  name: string;
  /** 'YYYY-MM-DD': the day it was made, which the list groups by. */
  day: string;
  amount: number;
  category: string;
  categoryColor?: string;
  type: 'income' | 'expense';
  /** "4/10" or "Todo mês", when it comes from a recurring expense. */
  badge?: string;
  /** The invoice a purchase on credit goes into: "Fatura nov". */
  tag?: string;
  /** Planned for a month that has not started: muted, and not pressable. */
  planned?: boolean;
}

export interface DayGroupedListProps {
  transactions: DayListItem[];
  emptyMessage: string;
  onPressItem: (id: number) => void;
}

// Spending limits per category: the sheet that sets one.
export interface LimitSheetProps {
  visible: boolean;
  categoryName: string;
  /** What the field starts with: the current limit, or empty. */
  initialValue: string;
  hasLimit: boolean;
  /** What went wrong saving, shown inside the dialog. */
  error?: string | null;
  onSave: (amount: number) => void;
  onRemove: () => void;
  onClose: () => void;
}

export const ADD_LIMIT_LABEL = 'Definir limite';
export const LIMIT_PICKER_TITLE = 'Limite para qual categoria?';
export const LIMIT_SHEET_TITLE = (name: string) => `Limite de ${name}`;
export const LIMIT_SHEET_HINT = 'Vale a partir deste mês. Os meses anteriores mantêm o limite que tinham.';
export const LIMIT_PLACEHOLDER = '0,00';
export const LIMIT_SAVE_LABEL = 'Salvar limite';
export const LIMIT_REMOVE_LABEL = 'Remover limite';
export const LIMIT_INVALID_TOAST = { type: 'error', title: 'Informe um valor maior que zero.' } as const;
export const LIMIT_SAVED_TOAST = { type: 'success', title: 'Limite salvo', icon: 'flag' } as const;
export const LIMIT_REMOVED_TOAST = { type: 'success', title: 'Limite removido', icon: 'flag' } as const;

// Error of the limit dialog (shown inside it).
export const LIMIT_FAILED_MESSAGE = 'Não foi possível salvar o limite.';
