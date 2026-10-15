import { type Palette } from '@/constants/palette';

export interface PieDataItem {
  value: number;
  color: string;
  label: string;
}

export interface ExpenseChartProps {
  pieData: PieDataItem[];
  totalGastos: number;
}

export interface MonthlyProgressProps {
  totalGastos: number;
  progress: number;
  percentage: number;
  hasBudget: boolean;
}

// Single neutral slice so the donut keeps its shape when there is nothing to plot.
export const emptyPieData = (colors: Palette): PieDataItem[] => [{ value: 100, color: colors.line, label: '' }];

export const EMPTY_CHART_TITLE = 'Nenhum gasto neste mês';
export const EMPTY_CHART_HINT = 'Toque em + para registrar seu primeiro gasto.';
export const EMPTY_TRANSACTIONS_MESSAGE = 'Seus gastos do mês aparecem aqui';

// Spending limits per category.
export interface LimitRow {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  /** The limit in force in the month shown; null when there is none. */
  limit: number | null;
}

export interface CategoryLimitsProps {
  rows: LimitRow[];
  /** Limits are set from the current month on, so only the current month can be edited. */
  canEdit: boolean;
  onPressRow: (categoryId: string) => void;
  onAdd: () => void;
}

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

export const LIMITS_TITLE = 'Limites por categoria';
export const LIMITS_EMPTY = 'Defina um teto para uma categoria e acompanhe o quanto já foi gasto nela.';
export const ADD_LIMIT_LABEL = 'Definir limite';
export const NO_LIMIT_LABEL = 'Sem limite · toque para definir';
export const LIMIT_PROGRESS = (spent: string, limit: string) => `${spent} de ${limit}`;
export const LIMIT_PASSED = (over: string) => `Passou ${over}`;
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
