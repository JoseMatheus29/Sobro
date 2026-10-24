import { type HistoryEntry } from '@/utils/history-type';
import { type FutureMonth } from '@/utils/recurrence-type';

export interface MonthRowProps {
  entry: HistoryEntry;
  /** The month the screens are showing now. */
  selected: boolean;
  onPress: () => void;
}

export interface FutureMonthRowProps {
  entry: FutureMonth;
  selected: boolean;
  onPress: () => void;
}

export const HISTORY_TITLE = 'Histórico de meses';
export const HISTORY_SUBTITLE = (kept: number, total: number) =>
  total <= 1
    ? 'Os meses anteriores aparecem aqui conforme você registra'
    : `Sobrou dinheiro em ${kept} dos últimos ${total} meses`;

export const CURRENT_BADGE = 'ATUAL';
export const KEPT_LABEL = 'sobrou';
export const MISSING_LABEL = 'faltou';
export const INCOME_LABEL = 'Entradas';
export const EXPENSE_LABEL = 'Saídas';
export const BUDGET_USE_LABEL = (percent: number) => `${percent}% do orçamento`;
export const NO_BUDGET_LABEL = 'Sem orçamento';

// The sheet is as tall as its content, up to this share of the screen.
export const SHEET_MAX_HEIGHT = '90%';

// The months ahead with something planned in them (from the recurring expenses).
export const FUTURE_SECTION = 'Próximos meses';
export const PAST_SECTION = 'Até agora';
export const COMMITTED_LABEL = 'comprometido';
// What a month ahead is made of: purchases on credit already registered (their invoice falls due then) and what the
// recurring expenses plan.
export const FUTURE_REGISTERED_LABEL = (amount: string) => `${amount} já lançados`;
export const FUTURE_COUNT_LABEL = (count: number, installments: number) =>
  installments > 0
    ? `${count} ${count === 1 ? 'previsto' : 'previstos'} · ${installments} ${installments === 1 ? 'parcelado' : 'parcelados'}`
    : `${count} ${count === 1 ? 'previsto' : 'previstos'}`;
