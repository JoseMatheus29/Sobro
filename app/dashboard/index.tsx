import React, { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import AddTransactionFab from '../components/AddTransactionFab';
import { SCROLL_PADDING_WITH_FAB } from '../components/sidebar-type';
import { useSelectedMonth } from '../components/month/MonthProvider';
import ScreenScroll from '../components/ui/ScreenScroll';
import CardBalance from './CardBalance';
import DashboardHeader from './components/DashboardHeader';
import FlowSection from './components/FlowSection';
import InsightHighlight from './components/InsightHighlight';
import PlannedCard from './components/PlannedCard';
import RecentTransactions from './components/RecentTransactions';
import {
  PLANNED_TITLE,
  RECENT_LIST_BORDER,
  RECENT_MAX,
  RECENT_MIN,
  RECENT_MONTH_TITLE,
  RECENT_ROW_HEIGHT,
  RECENT_TITLE,
  RECENT_TITLE_HEIGHT,
  SECTION_GAP,
  SUMMARY_OVERLAP,
} from './dashboard-type';
import { useBudgetEntries, useCategoryBudgets, useMonthTransactions, useProfile, useTransactions } from '@/db/hooks';
import { budgetForMonth } from '@/utils/budget';
import { limitsForMonth } from '@/utils/categoryBudget';
import { generateInsights } from '@/utils/insightRules';
import { monthEnd, monthKeyWithYear, monthNameOf } from '@/utils/month';
import { buildSummary } from '@/utils/summary';

export default function DashboardScreen() {
  const router = useRouter();

  const { month, isCurrent, isFuture } = useSelectedMonth();
  const { current, previous } = useMonthTransactions(month);
  const { transactions: recent } = useTransactions({ month, limit: RECENT_MAX });
  const { entries: budgetEntries } = useBudgetEntries();
  const { entries: limitEntries } = useCategoryBudgets();
  const { profile } = useProfile();

  // The budget that applied to the month shown, and, for a month that is over, "today" is its last
  // day: it is compared with the whole of the month before it.
  const budget = budgetForMonth(budgetEntries, month);
  const summary = useMemo(
    () => buildSummary({ current, previous, budget, now: isCurrent ? new Date() : monthEnd(month) }),
    [current, previous, budget, isCurrent, month]
  );
  // The tips are about the month in progress.
  const insights = useMemo(
    () =>
      isCurrent
        ? generateInsights({ current, previous, now: new Date(), limits: limitsForMonth(limitEntries, month) })
        : [],
    [current, previous, isCurrent, limitEntries, month]
  );

  // How many recent rows fit between the list's top and the floating button, measured from the
  // layout. Until it is measured the minimum is shown.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [recentsTop, setRecentsTop] = useState(0);

  const listTop = headerHeight - SUMMARY_OVERLAP + recentsTop + RECENT_TITLE_HEIGHT;
  const freeHeight = viewportHeight - SCROLL_PADDING_WITH_FAB - listTop - RECENT_LIST_BORDER;
  const fitCount = Math.floor(freeHeight / RECENT_ROW_HEIGHT);
  const recentCount = Math.min(RECENT_MAX, Math.max(RECENT_MIN, fitCount));

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      {/* The header scrolls with the content. A fixed header with a scroll view pulled up over it
          let the content slide across the strip of blue it overlaps. */}
      <ScreenScroll onLayout={(e: LayoutChangeEvent) => setViewportHeight(e.nativeEvent.layout.height)}>
        <View onLayout={(e: LayoutChangeEvent) => setHeaderHeight(e.nativeEvent.layout.height)}>
          <DashboardHeader userName={profile?.name} />
        </View>

        <View className="px-5" style={{ marginTop: -SUMMARY_OVERLAP }}>
          {isFuture ? (
            <PlannedCard summary={summary} budget={budget} />
          ) : (
            <CardBalance
              summary={summary}
              budget={budget}
              onPressBudget={isCurrent ? () => router.push('/editAcount') : undefined}
            />
          )}

          {!isFuture && (
            <View style={{ marginTop: SECTION_GAP }}>
              <FlowSection summary={summary} monthLabel={monthKeyWithYear(month)} />
            </View>
          )}

          {insights.length > 0 && (
            <View style={{ marginTop: SECTION_GAP }}>
              <InsightHighlight
                insight={insights[0]}
                count={insights.length}
                onPress={() => router.push('/insights')}
              />
            </View>
          )}

          <View
            style={{ marginTop: SECTION_GAP }}
            onLayout={(e: LayoutChangeEvent) => setRecentsTop(e.nativeEvent.layout.y)}
          >
            <RecentTransactions
              title={
                isFuture
                  ? PLANNED_TITLE(monthNameOf(month))
                  : isCurrent
                    ? RECENT_TITLE
                    : RECENT_MONTH_TITLE(monthNameOf(month))
              }
              transactions={recent.slice(0, recentCount)}
              onSeeAll={() => router.push('/wallet')}
              onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
            />
          </View>
        </View>
      </ScreenScroll>

      <SideBar />
      <AddTransactionFab />
    </View>
  );
}
