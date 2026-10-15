import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';

import { currentMonthKey } from '@/utils/month';
import { MonthContextValue } from '@/types/components/month/month-type';

const MonthContext = createContext<MonthContextValue | null>(null);

// The month every tab screen is looking at. It follows the calendar until one is picked from the
// history, and goes back to following it when the current month is picked again.
export function MonthProvider({ children }: { children: React.ReactNode }) {
  const [picked, setPicked] = useState<string | null>(null);
  // Bumped when the app comes back to the foreground, so a month that turned meanwhile is noticed.
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setTick((t) => t + 1);
    });
    return () => sub.remove();
  }, []);

  const currentMonth = currentMonthKey();
  const month = picked ?? currentMonth;

  const setMonth = useCallback((next: string) => {
    setPicked(next === currentMonthKey() ? null : next);
  }, []);

  const value = useMemo<MonthContextValue>(
    () => ({ month, isCurrent: month === currentMonth, isFuture: month > currentMonth, setMonth }),
    [month, currentMonth, setMonth]
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useSelectedMonth(): MonthContextValue {
  const value = useContext(MonthContext);
  if (!value) throw new Error('useSelectedMonth must be used inside <MonthProvider>');
  return value;
}

// Everything under app/ is a route for Expo Router, which warns about a file with no default export.
export default MonthProvider;
