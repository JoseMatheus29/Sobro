import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { getCards, type CardRecord } from './cards';
import { getCategories, type CategoryRecord } from './categories';
import { getProfile, type ProfileRecord } from './profile';
import {
  getCategoryTotals,
  getTransactions,
  type CategoryTotal,
  type TransactionFilters,
  type TransactionRecord,
} from './transactions';

// Screens under a Stack navigator stay mounted when you navigate away and back
// (e.g. registrationSpent -> wallet), so a plain useEffect-on-mount would miss
// data written elsewhere. Refetching on focus keeps every screen showing
// what's actually in the database.

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

  return { cards, loading, refetch };
}

export function useTransactions(filters: TransactionFilters = {}) {
  const db = useSQLiteContext();
  const { cardId, month } = filters;
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setTransactions(await getTransactions(db, { cardId, month }));
    setLoading(false);
  }, [db, cardId, month]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return { transactions, loading, refetch };
}

export function useCategoryTotals(filters: { month?: string } = {}) {
  const db = useSQLiteContext();
  const { month } = filters;
  const [totals, setTotals] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    setTotals(await getCategoryTotals(db, { month }));
    setLoading(false);
  }, [db, month]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return { totals, loading, refetch };
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

  return { categories, loading, refetch };
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

  return { profile, loading, refetch };
}
