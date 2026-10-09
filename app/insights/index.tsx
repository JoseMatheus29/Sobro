import React from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { useInsights } from '@/db/hooks';
import { MONTH_NAMES } from '@/utils/month';
import EmptyState from '../components/ui/EmptyState';
import { CLOSE_LABEL, SHEET_DIM_COLOR } from '../registrationSpent/registrationSpent-type';
import InsightItem from './components/InsightItem';
import {
  EMPTY_INSIGHTS_MESSAGE,
  INSIGHTS_SUBTITLE,
  INSIGHTS_TITLE,
  SHEET_MAX_HEIGHT,
} from './insights-type';

// A sheet over the Dashboard, like the new-transaction one: dimmed backdrop (tap to close)
// and a surface as tall as its content.
export default function InsightsSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { insights } = useInsights();
  const month = MONTH_NAMES[new Date().getUTCMonth()];

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable accessibilityLabel={CLOSE_LABEL} onPress={() => router.back()} style={{ flex: 1 }} />

      <View className="bg-canvas rounded-t-[28px] overflow-hidden" style={{ maxHeight: SHEET_MAX_HEIGHT }}>
        {/* Drag handle: marks the screen as a sheet */}
        <View className="items-center pt-2.5">
          <View className="w-10 h-1 rounded-full bg-surface-dark" />
        </View>

        <View className="h-14 items-center justify-center">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel={CLOSE_LABEL}
            className="absolute left-3 w-11 h-11 rounded-[14px] bg-surface items-center justify-center"
          >
            <Icon name="close" size={22} color={palette.primary.DEFAULT} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink">{INSIGHTS_TITLE}</Text>
        </View>

        <Text className="px-5 pb-3 text-[13px] text-muted text-center">{INSIGHTS_SUBTITLE(month)}</Text>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {insights.length === 0 ? (
            <EmptyState icon="lightbulb-outline" message={EMPTY_INSIGHTS_MESSAGE} />
          ) : (
            insights.map((insight) => <InsightItem key={insight.id} insight={insight} />)
          )}
        </ScrollView>
      </View>
    </View>
  );
}
