import { type TransactionRecord } from '@/db/transactions';
import { type MonthSummary, type SummaryInput } from './summary-type';
import { spendingDayInMonth } from './spendingDay';
import { withoutTransfers } from './transfer';

const sumAbs = (list: TransactionRecord[]) => list.reduce((sum, t) => sum + Math.abs(t.amount), 0);
const totalOf = (list: TransactionRecord[], type: TransactionRecord['type']) =>
  sumAbs(list.filter((t) => t.type === type));

// The figures behind the Dashboard: the balance of the month, how it compares with the last one,
// and how much of the income and of the budget went out.
export function buildSummary({ current: allCurrent, previous: allPrevious, budget, now }: SummaryInput): MonthSummary {
  // Moving money between accounts is neither income nor expense.
  const current = withoutTransfers(allCurrent);
  const previous = withoutTransfers(allPrevious);
  const income = totalOf(current, 'income');
  const expense = totalOf(current, 'expense');
  const net = income - expense;

  // Only the days that already happened this month: a full previous month would always look bigger.
  const day = now.getUTCDate();
  const previousSoFar = previous.filter((t) => spendingDayInMonth(t) <= day);
  const previousIncome = totalOf(previousSoFar, 'income');
  const previousNet = previousIncome - totalOf(previousSoFar, 'expense');

  return {
    income,
    expense,
    net,
    transactionCount: current.length,
    netChange: previousSoFar.length > 0 ? net - previousNet : null,
    incomeChange: previousIncome > 0 ? (income - previousIncome) / previousIncome : null,
    incomeUse: income > 0 ? expense / income : null,
    budgetUse: budget !== null && budget > 0 ? expense / budget : null,
  };
}
