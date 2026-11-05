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
import { daysInMonth, monthKey, MONTH_NAMES } from './month';
import { occurrenceIn } from './recurrence';
import { type RecurrenceRecord } from './recurrence-type';
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

// The day of the month a purchase was made (the day itself at noon UTC, see `TransactionRecord.occurredAt`).
const purchaseDay = (t: TransactionRecord) => new Date(t.occurredAt).getUTCDate();

// What the recurring expenses will still put in this month: the ones whose occurrence of the month falls after `now`
// and was not turned into a transaction yet. The server only makes it when it falls due.
function recurringAhead(recurrences: RecurrenceRecord[], now: Date): number {
  const month = monthKey(now);
  const nowIso = now.toISOString();
  let ahead = 0;
  for (const r of recurrences) {
    if (r.generatedUntil >= month) continue;
    const occurrence = occurrenceIn(r, month);
    if (occurrence && occurrence.date > nowIso) ahead += r.amount;
  }
  return ahead;
}

// Insights and tips drawn from what the user registered: this month against the same stretch of
// the last one, where the money goes, and where the month is heading. Rule-based and on-device,
// like the rest of the app. Most relevant first.
//
// Two views of the same money, on purpose. How the person *behaves* (the trend against last month, the category that
// grew, the pace of the month) is read by the day of each purchase: an invoice falls due on one day as a lump, and
// counting it there made a first week look like a spree and the pace look like ten times the income. What the month
// *comes to* (the balance, the biggest category, a single heavy expense, the limits) is read the way the Início and the
// Detalhamento show it, by the month each spending counts in, so the tips match the figures on screen.
export function generateInsights({
  current: allCurrent,
  previous: allPrevious,
  byPurchase,
  recurrences = [],
  now,
  limits,
}: InsightInput): Insight[] {
  // Moving money between accounts says nothing about how the person spends.
  const current = withoutTransfers(allCurrent);
  const previous = withoutTransfers(allPrevious);
  const purchasesThisMonth = withoutTransfers(byPurchase?.current ?? allCurrent);
  const purchasesLastMonth = withoutTransfers(byPurchase?.previous ?? allPrevious);
  const month = MONTH_NAMES[now.getUTCMonth()];
  const previousMonth = MONTH_NAMES[(now.getUTCMonth() + 11) % 12];
  const day = now.getUTCDate();

  if (current.length === 0 && purchasesThisMonth.length === 0) {
    if (previous.length === 0 && purchasesLastMonth.length === 0) return [];
    return [{ id: 'empty-month', tone: 'neutral', icon: 'edit-note', ...INSIGHT_COPY.emptyMonth(month) }];
  }

  const expenses = current.filter((t) => t.type === 'expense');
  const spent = sumAbs(expenses);
  const received = sumAbs(current.filter((t) => t.type === 'income'));

  // What was bought up to today, and in the same stretch of last month: the first week of a month is not "below" a
  // whole one.
  const bought = purchasesThisMonth.filter((t) => t.type === 'expense' && purchaseDay(t) <= day);
  const boughtSpent = sumAbs(bought);
  const boughtBefore = purchasesLastMonth.filter((t) => t.type === 'expense' && purchaseDay(t) <= day);
  const boughtBeforeSpent = sumAbs(boughtBefore);

  const found: Insight[] = [];
  const add = (id: string, tone: InsightTone, icon: string, copy: { title: string; tip: string }) =>
    found.push({ id, tone, icon, ...copy });

  // Spending against the same stretch of last month.
  if (boughtSpent > 0 && boughtBeforeSpent > 0) {
    const change = (boughtSpent - boughtBeforeSpent) / boughtBeforeSpent;
    const difference = formatMoney(Math.abs(boughtSpent - boughtBeforeSpent));
    if (Math.abs(change) < TREND_STABLE_BELOW) {
      add('trend', 'neutral', 'trending-flat', INSIGHT_COPY.trendStable(previousMonth, day, formatMoney(boughtSpent)));
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
  }

  // The category that grew the most against the same stretch of last month, by what was bought.
  if (bought.length >= MIN_EXPENSES_FOR_BREAKDOWN) {
    const previousByCategory = sumByCategory(boughtBefore);
    let spike: { category: CategorySum; increase: number; ratio: number } | null = null;
    for (const category of sumByCategory(bought).values()) {
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

  // Where the month is heading. What is bought day to day is projected at its average; the bills and installments
  // (what a recurring expense made) are not a daily habit, so what is already in the month and what is still to fall
  // due in it are added as they are instead of being stretched over the days.
  if (boughtSpent > 0 && day >= PACE_MIN_DAY) {
    const daily = sumAbs(bought.filter((t) => !t.recurrence));
    const fixed = sumAbs(bought.filter((t) => t.recurrence)) + recurringAhead(recurrences, now);
    const projectedValue = (daily / day) * daysInMonth(now) + fixed;
    const projected = formatMoney(projectedValue);
    if (received > 0 && projectedValue > received) {
      add('pace', 'warning', 'speed', INSIGHT_COPY.paceOverIncome(month, projected, formatMoney(received)));
    } else {
      add('pace', 'neutral', 'speed', INSIGHT_COPY.paceNeutral(month, projected, formatMoney(daily / day), fixed > 0));
    }
  }

  return found
    .map((insight, index) => ({ insight, index }))
    .sort((a, b) => TONE_ORDER[a.insight.tone] - TONE_ORDER[b.insight.tone] || a.index - b.index)
    .map(({ insight }) => insight);
}
