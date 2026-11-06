import { type TransactionRecord } from '@/db/transactions';
import { type ToastOptions } from '@/types/components/feedback/feedback-type';
import { BUDGET_CAUTION_AT } from './budget-type';
import { isSpending } from './spending';
import {
  ALERT_EPSILON,
  ALERT_MORE,
  ALERT_RANK,
  alertMessage,
  alertTitle,
  type AlertLevel,
  type SpendingAlert,
  type SpendingChange,
} from './spendingAlerts-type';

// What an expense adds to the month's spending, or null when it is not spending at all (an income, a transfer, the
// payment of an invoice).
export function changeOf(t: TransactionRecord): SpendingChange | null {
  if (!isSpending(t)) return null;
  return { categoryId: t.categoryId, categoryName: t.categoryName, amount: Math.abs(t.amount) };
}

export function alertLevel(spent: number, ceiling: number): AlertLevel {
  if (ceiling <= 0) return 'ok';
  if (spent - ceiling > ALERT_EPSILON) return 'over';
  return spent / ceiling >= BUDGET_CAUTION_AT ? 'caution' : 'ok';
}

// The warnings a change brings: the budget or a category limit that, with it, went up a step (close to the ceiling, or
// past it). One that was already there before is not told again, so it comes up once, when it is crossed.
// `spent` and `byCategory` are the month's spending as it is NOW (with the change); the state before is worked out by
// taking the change back. The most serious come first.
export function spendingAlerts(input: {
  budget: number | null;
  limits: Record<string, number>;
  spent: number;
  byCategory: Record<string, number>;
  added: SpendingChange | null;
  removed: SpendingChange | null;
}): SpendingAlert[] {
  const { budget, limits, spent, byCategory, added, removed } = input;
  const alerts: SpendingAlert[] = [];

  const shift = (categoryId: string | null) => {
    const plus = added && (categoryId === null || added.categoryId === categoryId) ? added.amount : 0;
    const minus = removed && (categoryId === null || removed.categoryId === categoryId) ? removed.amount : 0;
    return minus - plus; // what to add to "now" to get "before"
  };
  const raised = (now: number, before: number, ceiling: number): 'caution' | 'over' | null => {
    const after = alertLevel(now, ceiling);
    return after !== 'ok' && ALERT_RANK[after] > ALERT_RANK[alertLevel(before, ceiling)] ? after : null;
  };

  if (budget !== null && budget > 0) {
    const level = raised(spent, spent + shift(null), budget);
    if (level) alerts.push({ kind: 'budget', level, spent, ceiling: budget });
  }

  for (const [categoryId, ceiling] of Object.entries(limits)) {
    const now = byCategory[categoryId] ?? 0;
    const level = raised(now, now + shift(categoryId), ceiling);
    if (!level) continue;
    const name = [added, removed].find((c) => c?.categoryId === categoryId)?.categoryName ?? categoryId;
    alerts.push({ kind: 'category', level, categoryId, categoryName: name, spent: now, ceiling });
  }

  return alerts.sort(
    (a, b) =>
      ALERT_RANK[b.level] - ALERT_RANK[a.level] ||
      (a.kind === b.kind ? 0 : a.kind === 'budget' ? -1 : 1) ||
      b.spent / b.ceiling - a.spent / a.ceiling
  );
}

// The toast that tells the most serious warning, and says how many others there are.
export function alertToast(alerts: SpendingAlert[]): ToastOptions | null {
  const [first, ...others] = alerts;
  if (!first) return null;
  return {
    type: 'warning',
    title: alertTitle(first),
    message: `${alertMessage(first)}${others.length > 0 ? ` ${ALERT_MORE(others.length)}` : ''}`,
    icon: first.level === 'over' ? 'error-outline' : 'warning-amber',
  };
}
