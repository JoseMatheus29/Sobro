import { type MonthTotals } from './history-type';

// What the person already has when a month starts: the starting balance of the accounts plus what was left (entradas
// minus saídas) of every month before it. Nothing is lost when a month turns: it is the same balance, which the
// month then adds to or takes from. Months are 'YYYY-MM' keys, so they compare as text.
//
// It is worked out from the same totals the history lists ("o que sobrou" of each month: by the month a spending
// counts in, with the moves between accounts and the payments of invoices left out), so the balance of the Início is
// always the running total of those rows.
export function carryOver(totals: MonthTotals[], month: string, startingBalance: number): number {
  const before = totals.filter((entry) => entry.month < month);
  return before.reduce((sum, entry) => sum + entry.income - entry.expense, startingBalance);
}
