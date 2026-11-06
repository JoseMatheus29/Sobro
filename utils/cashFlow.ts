import { type TransactionRecord } from '@/db/transactions';
import { type CashPosition, type FlowSummary, type MonthCash } from './cashFlow-type';
import { type GoalEntryRecord } from './goals-type';
import { isTransfer } from './transfer';

// The Saldo of the Início is the money the person can spend today, the way an account is: what was paid with Pix or
// debit left it at once, an invoice leaves it when it is paid (the payment is an expense), and what is put into a
// caixinha leaves it too, because it can no longer be spent. This file works out how a month moved that money.

const cents = (value: number) => Math.round(value * 100) / 100;

// Whether a transaction moved money in or out of the accounts. Not a transfer (its legs cancel each other), not a row
// that is only planned, and not a purchase on credit: that waits in the invoice, and paying the invoice is the outflow.
export function movedMoney(t: Pick<TransactionRecord, 'transferId' | 'planned' | 'paymentMethod'>): boolean {
  return !isTransfer(t) && !t.planned && t.paymentMethod !== 'credit';
}

// What came in and what went out of the accounts in the transactions of a month (by the day of each one).
export function cashOf(rows: TransactionRecord[]): MonthCash {
  let income = 0;
  let outflow = 0;
  for (const t of rows) {
    if (!movedMoney(t)) continue;
    if (t.type === 'income') income += Math.abs(t.amount);
    else outflow += Math.abs(t.amount);
  }
  return { income: cents(income), outflow: cents(outflow) };
}

// The month ('YYYY-MM') of an instant on the phone's calendar: a deposit at 22h on the last day of a month is still
// that month, though in UTC it is already the next.
function localMonthOf(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// What was put into the caixinhas, minus what was taken out, in a month. A deposit is positive.
export function savedInMonth(entries: GoalEntryRecord[], month: string): number {
  return cents(entries.filter((entry) => localMonthOf(entry.occurredAt) === month).reduce((sum, entry) => sum + entry.amount, 0));
}

// What a month did to the money that can be spent: what came in, less what went out, less what was set aside.
export function monthChange(cash: MonthCash, saved: number): number {
  return cents(cash.income - cash.outflow - saved);
}

interface PositionInput {
  /** What can be spent today: the balances of the accounts minus what is in the caixinhas. */
  availableNow: number;
  /** The month looked at, and the one the phone's calendar is in. */
  month: string;
  currentMonth: string;
  /** What the month looked at did, and what each of the months after it (up to the current one) did. */
  change: number;
  changesAfter: number[];
}

// Where the money that can be spent stood at the start and at the end of a month. For the current month the end is
// today; for an older one it is today less what every month after it did. Going back from what the server says is
// there now keeps it equal to the accounts (the Carteira) however the older months are looked at.
export function cashPosition({ availableNow, month, currentMonth, change, changesAfter }: PositionInput): CashPosition {
  const after = month < currentMonth ? changesAfter.reduce((sum, value) => sum + value, 0) : 0;
  const closing = cents(availableNow - after);
  return { closing, opening: cents(closing - change), change };
}

// The Fluxo de Caixa of a month: what came in, what went out, what went into caixinhas, and how the income compares
// with the same stretch of the previous month. `now` is today for the current month and the last day of an older one.
export function buildFlow({
  current,
  previous,
  saved,
  now,
}: {
  current: TransactionRecord[];
  previous: TransactionRecord[];
  saved: number;
  now: Date;
}): FlowSummary {
  const { income, outflow } = cashOf(current);
  const day = now.getUTCDate();
  const previousIncome = cashOf(previous.filter((t) => new Date(t.occurredAt).getUTCDate() <= day)).income;

  return {
    income,
    expense: outflow,
    saved,
    incomeChange: previousIncome > 0 ? (income - previousIncome) / previousIncome : null,
    incomeUse: income > 0 ? outflow / income : null,
  };
}
