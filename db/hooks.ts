import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { useCategoryColor } from '@/hooks/useColors';
import { type BudgetEntry } from '@/utils/budget';
import { type GoalEntryRecord, type GoalRecord } from '@/utils/goals-type';
import { limitsForMonth, type CategoryBudgetEntry } from '@/utils/categoryBudget';
import { buildHistory } from '@/utils/history';
import { generateInsights } from '@/utils/insightRules';
import { addMonths, monthKey } from '@/utils/month';
import { futureMonths, plannedTransactions } from '@/utils/recurrence';
import { type RecurrenceRecord } from '@/utils/recurrence-type';

import { getBudgetEntries } from './budgets';
import { getCards, type CardRecord } from './cards';
import { getCategoryBudgetEntries } from './categoryBudgets';
import { getGoalById, getGoalEntries, getGoals } from './goals';
import { getCategories, type CategoryRecord } from './categories';
import { useRefetchOnDataChange } from './events';
import { getProfile, type ProfileRecord } from './profile';
import { getRecurrences } from './recurrences';
import {
  getCategoryTotals,
  getMonthlyTotals,
  getTransactions,
  type CategoryTotal,
  type TransactionFilters,
  type TransactionRecord,
} from './transactions';

// Screens under a Stack navigator stay mounted when you navigate away and back
// (e.g. registrationSpent -> wallet), so a plain useEffect-on-mount would miss
// data written elsewhere. Refetching on focus keeps every screen showing
// what's actually in the database. Data that changes without a screen doing it (the recurring
// expenses that fell due while the app was in the background) calls `notifyDataChanged`, and
// `useRefetchOnDataChange` makes each hook below read again.

export function useCards() {
  const db = useSQLiteContext();
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setCards(await getCards(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { cards, loading, refetch };
}

// The recurring expenses, with their category and account. Only read when asked to: most screens do not need them.
export function useRecurrences(enabled = true) {
  const db = useSQLiteContext();
  const [recurrences, setRecurrences] = useState<RecurrenceRecord[]>([]);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setRecurrences(await getRecurrences(db));
    setLoading(false);
  }, [db, enabled]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { recurrences, loading, refetch };
}

// A month that has not started has no transactions yet: what shows in it is what the recurring
// expenses plan for it, as rows marked `planned` (see utils/recurrence.ts).
export function useTransactions(filters: TransactionFilters = {}) {
  const db = useSQLiteContext();
  const { cardId, month, limit } = filters;
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const future = month !== undefined && month > monthKey(new Date());
  const { recurrences } = useRecurrences(future);
  const planned = useMemo(
    () => (future && month ? plannedTransactions(recurrences, month, new Date(), { cardId }) : []),
    [future, month, recurrences, cardId]
  );

  const refetch = useCallback(async () => {
    if (future) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setTransactions(await getTransactions(db, { cardId, month, limit }));
    setLoading(false);
  }, [db, cardId, month, limit, future]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  // The category colors are drawn softened on the dark theme (see utils/color.ts), so every screen gets them that way.
  const recolor = useCategoryColor();
  const shown = useMemo(() => {
    const rows = future ? (limit !== undefined ? planned.slice(0, limit) : planned) : transactions;
    return rows.map((t) => ({ ...t, categoryColor: recolor(t.categoryColor) }));
  }, [future, limit, planned, transactions, recolor]);
  return { transactions: shown, loading, refetch };
}

// A month's transactions and the month before it: what the Dashboard and the insights compare.
export function useMonthTransactions(month: string) {
  const { transactions: current } = useTransactions({ month });
  const { transactions: previous } = useTransactions({ month: addMonths(month, -1) });
  return { current, previous };
}

// Tips and insights for the current month, drawn from this and the previous month's transactions.
// It also hands back the two months it read, so a screen that needs them does not fetch them twice.
export function useInsights() {
  const now = new Date();
  const { current, previous } = useMonthTransactions(monthKey(now));
  const { entries: limitEntries } = useCategoryBudgets();

  const insights = useMemo(
    () =>
      generateInsights({
        current,
        previous,
        now: new Date(),
        limits: limitsForMonth(limitEntries, monthKey(new Date())),
      }),
    [current, previous, limitEntries]
  );

  return { insights, current, previous };
}

// The spending limit of each category, kept per month like the monthly budget (utils/categoryBudget.ts).
export function useCategoryBudgets() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<CategoryBudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setEntries(await getCategoryBudgetEntries(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { entries, loading, refetch };
}

// The caixinhas, each with what is in it.
export function useGoals() {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setGoals(await getGoals(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { goals, loading, refetch };
}

// One caixinha and what was put in and taken out of it; goal is null once it does not exist anymore.
export function useGoal(id: number) {
  const db = useSQLiteContext();
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [entries, setEntries] = useState<GoalEntryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [found, foundEntries] = await Promise.all([getGoalById(db, id), getGoalEntries(db, id)]);
    setGoal(found);
    setEntries(foundEntries);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { goal, entries, loading, refetch };
}

// The monthly budget is kept per month: see utils/budget.ts for how a month's amount is picked.
export function useBudgetEntries() {
  const db = useSQLiteContext();
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setEntries(await getBudgetEntries(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { entries, loading, refetch };
}

// Every month with transactions (and the current one), newest first, for the history.
export function useMonthlyHistory() {
  const db = useSQLiteContext();
  const { entries: budgets } = useBudgetEntries();
  const [totals, setTotals] = useState<Awaited<ReturnType<typeof getMonthlyTotals>>>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setTotals(await getMonthlyTotals(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  const history = useMemo(
    () => buildHistory({ totals, budgets, currentMonth: monthKey(new Date()) }),
    [totals, budgets]
  );

  return { history, loading };
}

// The months ahead that have something planned in them, for the history.
export function useFutureMonths() {
  const { recurrences } = useRecurrences();
  const { entries: budgets } = useBudgetEntries();
  return useMemo(() => futureMonths(recurrences, budgets, new Date()), [recurrences, budgets]);
}

export function useCategoryTotals(filters: { month?: string } = {}) {
  const db = useSQLiteContext();
  const { month } = filters;
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const future = month !== undefined && month > monthKey(new Date());
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

  const refetch = useCallback(async () => {
    if (future) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setTotals(await getCategoryTotals(db, { month }));
    setLoading(false);
  }, [db, month, future]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  const recolor = useCategoryColor();
  const shown = useMemo(
    () =>
      (future ? planned : totals).map((t) => {
        const color = recolor(t.color);
        return { ...t, color, bg: color === t.color ? t.bg : `${color}1F` };
      }),
    [future, planned, totals, recolor]
  );
  return { totals: shown, loading, refetch };
}

export function useCategories() {
  const db = useSQLiteContext();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setCategories(await getCategories(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  const recolor = useCategoryColor();
  const shown = useMemo(
    () =>
      categories.map((c) => {
        const color = recolor(c.color);
        return { ...c, color, bg: color === c.color ? c.bg : `${color}1F` };
      }),
    [categories, recolor]
  );
  return { categories: shown, loading, refetch };
}

export function useProfile() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setProfile(await getProfile(db));
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  useRefetchOnDataChange(refetch);

  return { profile, loading, refetch };
}
