import { palette } from '@/constants/palette';

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
export const EMPTY_PIE_DATA: PieDataItem[] = [{ value: 100, color: palette.line, label: '' }];

export const EMPTY_CHART_TITLE = 'Nenhum gasto neste mês';
export const EMPTY_CHART_HINT = 'Toque em + para registrar seu primeiro gasto.';
export const EMPTY_TRANSACTIONS_MESSAGE = 'Seus gastos do mês aparecem aqui';
