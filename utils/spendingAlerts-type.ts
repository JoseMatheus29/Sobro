import { formatMoney } from './format';

// Where a spending stands against its ceiling. Only the two that call for a warning matter: close to the ceiling, and
// past it. (The bars have a third, "danger" from 90%, which is a color, not a warning.)
export type AlertLevel = 'ok' | 'caution' | 'over';
export const ALERT_RANK: Record<AlertLevel, number> = { ok: 0, caution: 1, over: 2 };

// What one expense adds to (or takes from) a month: a positive amount, in the category it counts in.
export interface SpendingChange {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface SpendingAlert {
  /** The month's budget as a whole, or the limit of one category. */
  kind: 'budget' | 'category';
  level: 'caution' | 'over';
  categoryId?: string;
  categoryName?: string;
  /** What is spent now and the ceiling it is measured against. */
  spent: number;
  ceiling: number;
}

// A small amount over the ceiling that is only rounding is not "over".
export const ALERT_EPSILON = 0.005;

// The warning comes up this long after the toast that confirms the expense, so that one can be read first.
export const ALERT_DELAY_MS = 2600;

const percent = (spent: number, ceiling: number) => Math.floor((spent / ceiling) * 100);

export const alertTitle = (a: SpendingAlert): string => {
  if (a.kind === 'budget') {
    return a.level === 'over' ? 'Orçamento do mês estourado' : `Orçamento do mês em ${percent(a.spent, a.ceiling)}%`;
  }
  return a.level === 'over'
    ? `Limite de ${a.categoryName} estourado`
    : `${a.categoryName} chegou a ${percent(a.spent, a.ceiling)}% do limite`;
};

export const alertMessage = (a: SpendingAlert): string => {
  const thing = a.kind === 'budget' ? 'o teto' : 'o limite';
  return a.level === 'over'
    ? `Passou ${formatMoney(a.spent - a.ceiling)} d${thing} de ${formatMoney(a.ceiling)}.`
    : `Faltam ${formatMoney(a.ceiling - a.spent)} para ${thing} de ${formatMoney(a.ceiling)}.`;
};

export const ALERT_MORE = (count: number) => `+ ${count} ${count === 1 ? 'outro aviso' : 'outros avisos'}`;
