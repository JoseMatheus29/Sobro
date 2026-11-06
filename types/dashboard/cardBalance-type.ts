import { type CashPosition } from '@/utils/cashFlow-type';
import { type MonthSummary } from '@/utils/summary-type';

export interface BalanceCardProps {
  /** What the month's spending comes to, for the budget bar (by the month each spending counts in). */
  summary: MonthSummary;
  /** The money that can be spent, at the end and at the start of the month, and what the month did to it. */
  position: CashPosition;
  /** The month shown is the current one: its end is today. */
  isCurrent: boolean;
  /** The monthly spending ceiling that applied to the month shown, if there was one. */
  budget: number | null;
  /** Opens where the budget is set; offered when there is none, for the current month only. */
  onPressBudget?: () => void;
}

// The balance is the money the person can spend, the way an account is: what was paid with Pix or debit, the payments of
// invoices and what goes into a caixinha all leave it, and a purchase on credit leaves it when its invoice is paid.
export const BALANCE_LABEL = 'Saldo disponível';
export const BALANCE_LABEL_PAST = 'Saldo no fim do mês';
export const MONTH_RESULT_LABEL = 'no mês';
export const MONTH_START_LABEL = 'Início do mês';

export const BUDGET_LABEL = 'Orçamento do mês';
export const BUDGET_REMAINING_LABEL = (percent: number) => `${percent}% restante`;
export const BUDGET_OVER_LABEL = (amount: string) => `Excedido em ${amount}`;
export const BUDGET_SPENT_LABEL = 'Gasto';
export const BUDGET_CEILING_LABEL = 'Teto';
export const NO_BUDGET_LABEL = 'Defina um orçamento mensal no seu perfil';
export const NO_BUDGET_PAST_LABEL = 'Sem orçamento definido neste mês';

// A bar with anything in it never shrinks below this share, so a small spend is still visible.
export const BUDGET_BAR_MIN_PERCENT = 3;

// The card of a month that has not started: only what the recurring expenses plan for it.
export const PLANNED_TAG = 'PREVISTO · O MÊS AINDA NÃO COMEÇOU';
export const PLANNED_OUT_LABEL = 'Saídas previstas';
export const PLANNED_COUNT_LABEL = (count: number) =>
  count === 1 ? '1 lançamento de saída recorrente' : `${count} lançamentos de saídas recorrentes e parcelas`;
export const PLANNED_USE_LABEL = (percent: number) => `Previsto: ${percent}% do teto`;
export const PLANNED_COMMITTED_LABEL = 'Comprometido';
