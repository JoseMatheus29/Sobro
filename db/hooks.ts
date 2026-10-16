import { useCallback, useMemo } from 'react';
import { keepPreviousData } from '@tanstack/react-query';

import { useCategoryColor } from '@/hooks/useColors';
import { limitsForMonth } from '@/utils/categoryBudget';
import { buildInvoice, openInvoiceMonth, plannedPurchases, todayKey } from '@/utils/invoice';
import { type Invoice } from '@/utils/invoice-type';
import { buildHistory } from '@/utils/history';
import { generateInsights } from '@/utils/insightRules';
import { addMonths, currentMonthKey, localNow } from '@/utils/month';
import { futureMonths, plannedTransactions } from '@/utils/recurrence';

import { getBudgetEntries } from './budgets';
import { getCards, type CardRecord } from './cards';
import { getInvoiceSources } from './invoices';
import { getCategoryBudgetEntries } from './categoryBudgets';
import { getGoalById, getGoalEntries, getGoals } from './goals';
import { getCategories } from './categories';
import { loadError, NONE, useScreenQuery } from './query';
import { queryKeys } from './queryKeys';
import { getProfile } from './profile';
import { getRecurrenceById, getRecurrences } from './recurrences';
import {
  getCategoryTotals,
  getMonthlyTotals,
  getTransactionById,
  getTransactions,
  getTransferLegs,
  type CategoryTotal,
  type TransactionFilters,
} from './transactions';

// Every hook here reads from the API through the in-memory cache (api/queryClient.ts) and hands back the same
// shape: its data, `loading` (only until the first answer), the `error` of a read that failed, and `refetch`.
// A query only runs while its screen is the one in front (db/query.ts), and `notifyDataChanged` (db/events.ts)
// marks everything old after a save, so a screen shows what was last read at once and then what is current.

// The accounts, each with its current balance (worked out by the server).
export function useCards() {
  const query = useScreenQuery({ queryKey: queryKeys.cards, queryFn: getCards });
  return { cards: query.data ?? NONE, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// One invoice (by the month it closes in) of the credit card of an account: what was bought in its cycle, what was
// paid and what is still planned (see utils/invoice.ts). Null while it loads, or when the account has no credit card.
export function useInvoice(card: CardRecord | null | undefined, month: string | null) {
  const credit = card?.credit ?? null;
  const rules = useMemo(
    () => (credit ? { closingDay: credit.closingDay, dueDay: credit.dueDay } : null),
    [credit]
  );
  const enabled = card != null && rules !== null && month !== null;

  const query = useScreenQuery({
    queryKey: queryKeys.invoice(card?.id ?? 0, month ?? '', rules?.closingDay ?? 0, rules?.dueDay ?? 0),
    queryFn: () => getInvoiceSources((card as CardRecord).id, month as string, rules as NonNullable<typeof rules>),
    enabled,
  });
  const { recurrences } = useRecurrences(enabled);
  const recolor = useCategoryColor();

  const { data } = query;
  const invoice: Invoice | null = useMemo(() => {
    if (!enabled || !data || !rules || !card || !month) return null;
    const built = buildInvoice({
      month,
      rules,
      purchases: data.purchases,
      payments: data.payments,
      planned: plannedPurchases(recurrences, month, rules, card.id),
      today: todayKey(),
    });
    // The category colors are drawn softened on the dark theme, like in every other list.
    return {
      ...built,
      purchases: built.purchases.map((t) => ({ ...t, categoryColor: recolor(t.categoryColor) })),
    };
  }, [enabled, data, rules, card, month, recurrences, recolor]);

  return { invoice, loading: enabled && query.isLoading, error: loadError(query), refetch: query.refetch };
}

// The invoice that is taking purchases now.
export function useOpenInvoice(card: CardRecord | null | undefined) {
  const credit = card?.credit ?? null;
  const month = credit ? openInvoiceMonth(todayKey(), credit) : null;
  return { month, ...useInvoice(card, month) };
}

// The recurring expenses, with their category and account. Only read when asked to: most screens do not need them.
export function useRecurrences(enabled = true) {
  const query = useScreenQuery({ queryKey: queryKeys.recurrences, queryFn: getRecurrences, enabled });
  return {
    recurrences: query.data ?? NONE,
    loading: enabled && query.isLoading,
    error: loadError(query),
    refetch: query.refetch,
  };
}

// One recurring expense; null once it does not exist anymore (or while there is none to look for).
export function useRecurrence(id: number | undefined) {
  const query = useScreenQuery({
    queryKey: queryKeys.recurrence(id ?? 0),
    queryFn: () => getRecurrenceById(id as number),
    enabled: id !== undefined,
  });
  return {
    recurrence: query.data ?? null,
    loading: id !== undefined && query.isLoading,
    error: loadError(query),
    refetch: query.refetch,
  };
}

// A month that has not started has no transactions yet: what shows in it is what the recurring
// expenses plan for it, as rows marked `planned` (see utils/recurrence.ts).
export function useTransactions(filters: TransactionFilters = {}) {
  const { cardId, month, limit, categoryId, type, q } = filters;

  const future = month !== undefined && month > currentMonthKey();
  const { recurrences } = useRecurrences(future);
  const planned = useMemo(
    () => (future && month ? plannedTransactions(recurrences, month, new Date(), { cardId }) : []),
    [future, month, recurrences, cardId]
  );

  const query = useScreenQuery({
    queryKey: queryKeys.transactions({ cardId, month, limit, categoryId, type, q }),
    queryFn: () => getTransactions({ cardId, month, limit, categoryId, type, q }),
    enabled: !future,
    // Moving to another month keeps showing the last one until the new one arrives.
    placeholderData: keepPreviousData,
  });
  const { refetch: refetchQuery } = query;
  const refetch = useCallback(async () => {
    if (!future) await refetchQuery();
  }, [future, refetchQuery]);

  // The category colors are drawn softened on the dark theme (see utils/color.ts), so every screen gets them that way.
  const recolor = useCategoryColor();
  const { data } = query;
  const shown = useMemo(() => {
    const rows = future ? (limit !== undefined ? planned.slice(0, limit) : planned) : (data ?? NONE);
    return rows.map((t) => ({ ...t, categoryColor: recolor(t.categoryColor) }));
  }, [future, limit, planned, data, recolor]);
  return {
    transactions: shown,
    loading: !future && (query.isLoading || query.isPlaceholderData),
    error: loadError(query),
    refetch,
  };
}

// One transaction; null once it does not exist anymore.
export function useTransaction(id: number) {
  const query = useScreenQuery({ queryKey: queryKeys.transaction(id), queryFn: () => getTransactionById(id) });
  return { transaction: query.data ?? null, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// The two legs of a transfer (the month is where both of them are).
export function useTransferLegs(transferId: number | null | undefined, month: string) {
  const query = useScreenQuery({
    queryKey: queryKeys.transferLegs(transferId ?? 0),
    queryFn: () => getTransferLegs(transferId as number, month),
    enabled: transferId !== null && transferId !== undefined,
  });
  return { legs: query.data ?? NONE, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// A month's transactions and the month before it: what the Dashboard and the insights compare.
export function useMonthTransactions(month: string) {
  const currentQuery = useTransactions({ month });
  const previousQuery = useTransactions({ month: addMonths(month, -1) });

  const { refetch: refetchCurrent } = currentQuery;
  const { refetch: refetchPrevious } = previousQuery;
  const refetch = useCallback(async () => {
    await Promise.all([refetchCurrent(), refetchPrevious()]);
  }, [refetchCurrent, refetchPrevious]);

  return {
    current: currentQuery.transactions,
    previous: previousQuery.transactions,
    loading: currentQuery.loading || previousQuery.loading,
    error: currentQuery.error ?? previousQuery.error,
    refetch,
  };
}

// Tips and insights for the current month, drawn from this and the previous month's transactions.
// It also hands back the two months it read, so a screen that needs them does not fetch them twice.
export function useInsights() {
  const { current, previous, loading, error, refetch } = useMonthTransactions(currentMonthKey());
  const { entries: limitEntries } = useCategoryBudgets();

  const insights = useMemo(
    () =>
      generateInsights({
        current,
        previous,
        now: localNow(),
        limits: limitsForMonth(limitEntries, currentMonthKey()),
      }),
    [current, previous, limitEntries]
  );

  return { insights, current, previous, loading, error, refetch };
}

// The spending limit of each category, kept per month like the monthly budget (utils/categoryBudget.ts).
export function useCategoryBudgets() {
  const query = useScreenQuery({ queryKey: queryKeys.categoryBudgets, queryFn: getCategoryBudgetEntries });
  return { entries: query.data ?? NONE, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// The caixinhas, each with what is in it.
export function useGoals() {
  const query = useScreenQuery({ queryKey: queryKeys.goals, queryFn: getGoals });
  return { goals: query.data ?? NONE, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// One caixinha and what was put in and taken out of it; goal is null once it does not exist anymore.
export function useGoal(id: number) {
  // Both are read at once.
  const goalQuery = useScreenQuery({ queryKey: queryKeys.goal(id), queryFn: () => getGoalById(id) });
  const entriesQuery = useScreenQuery({ queryKey: queryKeys.goalEntries(id), queryFn: () => getGoalEntries(id) });

  const { refetch: refetchGoal } = goalQuery;
  const { refetch: refetchEntries } = entriesQuery;
  const refetch = useCallback(async () => {
    await Promise.all([refetchGoal(), refetchEntries()]);
  }, [refetchGoal, refetchEntries]);

  return {
    goal: goalQuery.data ?? null,
    entries: entriesQuery.data ?? NONE,
    loading: goalQuery.isLoading || entriesQuery.isLoading,
    error: loadError(goalQuery) ?? loadError(entriesQuery),
    refetch,
  };
}

// The monthly budget is kept per month: see utils/budget.ts for how a month's amount is picked.
export function useBudgetEntries() {
  const query = useScreenQuery({ queryKey: queryKeys.monthlyBudgets, queryFn: getBudgetEntries });
  return { entries: query.data ?? NONE, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// Every month with transactions (and the current one), newest first, for the history.
export function useMonthlyHistory() {
  const { entries: budgets } = useBudgetEntries();
  const query = useScreenQuery({ queryKey: queryKeys.monthlyTotals, queryFn: getMonthlyTotals });
  const totals = query.data ?? NONE;

  const history = useMemo(() => buildHistory({ totals, budgets, currentMonth: currentMonthKey() }), [totals, budgets]);

  return { history, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// The months ahead that have something planned in them, for the history.
export function useFutureMonths() {
  const { recurrences } = useRecurrences();
  const { entries: budgets } = useBudgetEntries();
  return useMemo(() => futureMonths(recurrences, budgets, new Date()), [recurrences, budgets]);
}

export function useCategoryTotals(filters: { month?: string } = {}) {
  const { month } = filters;

  const future = month !== undefined && month > currentMonthKey();
  const { recurrences } = useRecurrences(future);
  const planned = useMemo(() => {
    if (!future || !month) return [];
    const byCategory = new Map<string, CategoryTotal>();
    for (const t of plannedTransactions(recurrences, month, new Date())) {
      const entry = byCategory.get(t.categoryId) ?? {
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        icon: t.categoryIcon,
        color: t.categoryColor,
        bg: `${t.categoryColor}1F`,
        total: 0,
      };
      entry.total += Math.abs(t.amount);
      byCategory.set(t.categoryId, entry);
    }
    return [...byCategory.values()].sort((x, y) => y.total - x.total);
  }, [future, month, recurrences]);

  const query = useScreenQuery({
    queryKey: queryKeys.categoryTotals(month),
    queryFn: () => getCategoryTotals({ month: month as string }),
    enabled: !future && month !== undefined,
    placeholderData: keepPreviousData,
  });
  const { refetch: refetchQuery } = query;
  const refetch = useCallback(async () => {
    if (!future && month !== undefined) await refetchQuery();
  }, [future, month, refetchQuery]);

  const totals = query.data ?? NONE;
  const recolor = useCategoryColor();
  const shown = useMemo(
    () =>
      (future ? planned : totals).map((t) => {
        const color = recolor(t.color);
        return { ...t, color, bg: color === t.color ? t.bg : `${color}1F` };
      }),
    [future, planned, totals, recolor]
  );
  return {
    totals: shown,
    loading: !future && (query.isLoading || query.isPlaceholderData),
    error: loadError(query),
    refetch,
  };
}

export function useCategories() {
  const query = useScreenQuery({ queryKey: queryKeys.categories, queryFn: getCategories });
  const categories = query.data ?? NONE;

  const recolor = useCategoryColor();
  const shown = useMemo(
    () =>
      categories.map((c) => {
        const color = recolor(c.color);
        return { ...c, color, bg: color === c.color ? c.bg : `${color}1F` };
      }),
    [categories, recolor]
  );
  return { categories: shown, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}

// The account's profile, with the light/dark choice of this phone.
export function useProfile() {
  const query = useScreenQuery({ queryKey: queryKeys.profile, queryFn: getProfile });
  return { profile: query.data ?? null, loading: query.isLoading, error: loadError(query), refetch: query.refetch };
}
