import { type MonthSummary } from '@/utils/summary-type';

export interface BalanceCardProps {
  summary: MonthSummary;
  /** The monthly spending ceiling that applied to the month shown, if there was one. */
  budget: number | null;
  /** Opens where the budget is set; offered when there is none, for the current month only. */
  onPressBudget?: () => void;
}

export const BALANCE_LABEL = 'Saldo mensal';

export const COMPARED_LABEL = 'vs. mês anterior';
export const TRANSACTION_COUNT_LABEL = (count: number) =>
  count === 0 ? 'Sem transações no mês' : count === 1 ? '1 transação no mês' : `${count} transações no mês`;

export const BUDGET_LABEL = 'Orçamento do mês';
export const BUDGET_REMAINING_LABEL = (percent: number) => `${percent}% restante`;
export const BUDGET_OVER_LABEL = (amount: string) => `Excedido em ${amount}`;
export const BUDGET_SPENT_LABEL = 'Gasto';
export const BUDGET_CEILING_LABEL = 'Teto';
export const NO_BUDGET_LABEL = 'Defina um orçamento mensal no seu perfil';
export const NO_BUDGET_PAST_LABEL = 'Sem orçamento definido neste mês';

// From this share of the budget on, the bar turns from green to red.
export const BUDGET_WARN_AT = 0.85;
// A bar with anything in it never shrinks below this share, so a small spend is still visible.
export const BUDGET_BAR_MIN_PERCENT = 3;

// The card of a month that has not started: only what the recurring expenses plan for it.
export const PLANNED_TAG = 'PREVISTO · O MÊS AINDA NÃO COMEÇOU';
export const PLANNED_OUT_LABEL = 'Saídas previstas';
export const PLANNED_COUNT_LABEL = (count: number) =>
  count === 1 ? '1 lançamento de saída recorrente' : `${count} lançamentos de saídas recorrentes e parcelas`;
export const PLANNED_USE_LABEL = (percent: number) => `Previsto: ${percent}% do teto`;
export const PLANNED_COMMITTED_LABEL = 'Comprometido';
