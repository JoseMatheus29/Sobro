import { type TransactionRecord } from '@/db/transactions';
import { formatMoney } from './format';
import {
  BIG_EXPENSE_SHARE,
  CATEGORY_TIPS,
  DEFAULT_CATEGORY_TIP,
  GOOD_SAVINGS_RATE,
  INSIGHT_COPY,
  LIMIT_WARN_AT,
  MIN_EXPENSES_FOR_BREAKDOWN,
  PACE_MIN_DAY,
  SPIKE_MIN_INCREASE,
  SPIKE_MIN_RATIO,
  TONE_ORDER,
  TREND_STABLE_BELOW,
  type Insight,
  type InsightInput,
  type InsightTone,
} from './insightRules-type';
import { daysInMonth, MONTH_NAMES } from './month';
import { spendingDayInMonth } from './spendingDay';
import { withoutTransfers } from './transfer';

interface CategorySum {
  id: string;
  name: string;
  icon: string;
  total: number;
}

const sumAbs = (list: TransactionRecord[]) => list.reduce((sum, t) => sum + Math.abs(t.amount), 0);
const percent = (ratio: number) => Math.round(ratio * 100);

function sumByCategory(expenses: TransactionRecord[]): Map<string, CategorySum> {
  const byCategory = new Map<string, CategorySum>();
  for (const t of expenses) {
    const entry = byCategory.get(t.categoryId) ?? {
      id: t.categoryId,
      name: t.categoryName,
      icon: t.categoryIcon,
      total: 0,
    };
    entry.total += Math.abs(t.amount);
    byCategory.set(t.categoryId, entry);
  }
  return byCategory;
}

// Insights and tips drawn from what the user registered: this month against the same stretch of
// the last one, where the money goes, and where the month is heading. Rule-based and on-device,
// like the rest of the app. Most relevant first.
export function generateInsights({ current: allCurrent, previous: allPrevious, now, limits }: InsightInput): Insight[] {
  // Moving money between accounts says nothing about how the person spends.
  const current = withoutTransfers(allCurrent);
  const previous = withoutTransfers(allPrevious);
  const month = MONTH_NAMES[now.getUTCMonth()];
  const previousMonth = MONTH_NAMES[(now.getUTCMonth() + 11) % 12];
  const day = now.getUTCDate();

  if (current.length === 0) {
    if (previous.length === 0) return [];
    return [{ id: 'empty-month', tone: 'neutral', icon: 'edit-note', ...INSIGHT_COPY.emptyMonth(month) }];
  }

  const expenses = current.filter((t) => t.type === 'expense');
  const spent = sumAbs(expenses);
  const received = sumAbs(current.filter((t) => t.type === 'income'));
  // Only the days that already happened this month: the first week of a month is not "below" a whole one.
  const previousExpenses = previous.filter((t) => t.type === 'expense' && spendingDayInMonth(t) <= day);
  const previousSpent = sumAbs(previousExpenses);

  const found: Insight[] = [];
  const add = (id: string, tone: InsightTone, icon: string, copy: { title: string; tip: string }) =>
    found.push({ id, tone, icon, ...copy });

  // Spending against the same stretch of last month.
  if (spent > 0 && previousSpent > 0) {
    const change = (spent - previousSpent) / previousSpent;
    const difference = formatMoney(Math.abs(spent - previousSpent));
    if (Math.abs(change) < TREND_STABLE_BELOW) {
      add('trend', 'neutral', 'trending-flat', INSIGHT_COPY.trendStable(previousMonth, day, formatMoney(spent)));
    } else if (change < 0) {
      add('trend', 'positive', 'trending-down', INSIGHT_COPY.trendDown(percent(-change), previousMonth, day, difference));
    } else {
      add('trend', 'warning', 'trending-up', INSIGHT_COPY.trendUp(percent(change), previousMonth, day, difference));
    }
  }

  // What was kept of what came in.
  if (received > 0) {
    if (spent > received) {
      add('balance', 'warning', 'warning-amber', INSIGHT_COPY.overspent(formatMoney(spent - received)));
    } else {
      const kept = (received - spent) / received;
      if (kept >= GOOD_SAVINGS_RATE) {
        add('balance', 'positive', 'savings', INSIGHT_COPY.saved(percent(kept), formatMoney(received - spent), month));
      } else {
        add('balance', 'neutral', 'savings', INSIGHT_COPY.savedLittle(percent(kept)));
      }
    }
  } else if (spent > 0) {
    add('balance', 'neutral', 'account-balance-wallet', INSIGHT_COPY.noIncome(month));
  }

  if (expenses.length >= MIN_EXPENSES_FOR_BREAKDOWN) {
    const categories = [...sumByCategory(expenses).values()];

    // Where most of the money goes.
    const top = categories.reduce((a, b) => (b.total > a.total ? b : a));
    add(
      'top-category',
      'neutral',
      top.icon,
      INSIGHT_COPY.topCategory(top.name, percent(top.total / spent), CATEGORY_TIPS[top.id] ?? DEFAULT_CATEGORY_TIP)
    );

    // A single expense that weighs on the month.
    const biggest = expenses.reduce((a, b) => (Math.abs(b.amount) > Math.abs(a.amount) ? b : a));
    if (Math.abs(biggest.amount) / spent >= BIG_EXPENSE_SHARE) {
      add(
        'big-expense',
        'neutral',
        biggest.categoryIcon,
        INSIGHT_COPY.bigExpense(biggest.name, percent(Math.abs(biggest.amount) / spent), formatMoney(Math.abs(biggest.amount)))
      );
    }

    // The category that grew the most against the same stretch of last month.
    const previousByCategory = sumByCategory(previousExpenses);
    let spike: { category: CategorySum; increase: number; ratio: number } | null = null;
    for (const category of categories) {
      const before = previousByCategory.get(category.id)?.total ?? 0;
      const increase = category.total - before;
      if (before > 0 && increase >= SPIKE_MIN_INCREASE && increase / before >= SPIKE_MIN_RATIO) {
        if (!spike || increase > spike.increase) spike = { category, increase, ratio: increase / before };
      }
    }
    if (spike) {
      add(
        'category-spike',
        'warning',
        spike.category.icon,
        INSIGHT_COPY.categorySpike(spike.category.name, percent(spike.ratio), previousMonth, formatMoney(spike.increase))
      );
    }
  }

  // A category close to, or past, the limit set for it: the one furthest along.
  if (limits) {
    let worst: { category: CategorySum; limit: number; use: number } | null = null;
    for (const category of sumByCategory(expenses).values()) {
      const limit = limits[category.id];
      if (!limit) continue;
      const use = category.total / limit;
      if (use >= LIMIT_WARN_AT && (!worst || use > worst.use)) worst = { category, limit, use };
    }
    if (worst) {
      const { category, limit, use } = worst;
      add(
        'category-limit',
        'warning',
        category.icon,
        use >= 1
          ? INSIGHT_COPY.limitPassed(category.name, formatMoney(limit), formatMoney(category.total), formatMoney(category.total - limit))
          : INSIGHT_COPY.limitNear(category.name, percent(use), formatMoney(limit - category.total))
      );
    }
  }

  // Where the month is heading at the current pace.
  if (spent > 0 && day >= PACE_MIN_DAY) {
    const projected = formatMoney((spent / day) * daysInMonth(now));
    if (received > 0 && (spent / day) * daysInMonth(now) > received) {
      add('pace', 'warning', 'speed', INSIGHT_COPY.paceOverIncome(month, projected, formatMoney(received)));
    } else {
      add('pace', 'neutral', 'speed', INSIGHT_COPY.paceNeutral(month, projected, formatMoney(spent / day)));
    }
  }

  return found
    .map((insight, index) => ({ insight, index }))
    .sort((a, b) => TONE_ORDER[a.insight.tone] - TONE_ORDER[b.insight.tone] || a.index - b.index)
    .map(({ insight }) => insight);
}
