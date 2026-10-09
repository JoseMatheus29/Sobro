import React, { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import AddTransactionFab from '../components/AddTransactionFab';
import { SCROLL_PADDING_WITH_FAB } from '../components/sidebar-type';
import ScreenScroll from '../components/ui/ScreenScroll';
import CardBalance from './CardBalance';
import DashboardHeader from './components/DashboardHeader';
import FlowSection from './components/FlowSection';
import InsightHighlight from './components/InsightHighlight';
import RecentTransactions from './components/RecentTransactions';
import {
  RECENT_LIST_BORDER,
  RECENT_MAX,
  RECENT_MIN,
  RECENT_ROW_HEIGHT,
  RECENT_TITLE_HEIGHT,
  SECTION_GAP,
  SUMMARY_OVERLAP,
} from './dashboard-type';
import { useInsights, useProfile, useTransactions } from '@/db/hooks';
import { monthWithYear } from '@/utils/month';
import { buildSummary } from '@/utils/summary';

export default function DashboardScreen() {
  const router = useRouter();

  const { insights, current, previous } = useInsights();
  const { transactions: recent } = useTransactions({ limit: RECENT_MAX });
  const { profile } = useProfile();

  const budget = profile?.monthlyBudget ?? null;
  const summary = useMemo(
    () => buildSummary({ current, previous, budget, now: new Date() }),
    [current, previous, budget]
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
          <CardBalance
            summary={summary}
            budget={budget}
            onPressBudget={() => router.push('/editAcount')}
          />

          <View style={{ marginTop: SECTION_GAP }}>
            <FlowSection summary={summary} monthLabel={monthWithYear(new Date())} />
          </View>

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
