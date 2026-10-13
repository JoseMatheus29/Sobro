import React from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useFutureMonths, useMonthlyHistory } from '@/db/hooks';
import { countKeptMonths } from '@/utils/history';
import { useSelectedMonth } from '@/app/components/month/MonthProvider';
import { CLOSE_LABEL, SHEET_DIM_COLOR } from '@/types/registrationSpent/registrationSpent-type';
import FutureMonthRow from '@/app/history/components/FutureMonthRow';
import MonthRow from '@/app/history/components/MonthRow';
import { FUTURE_SECTION, HISTORY_SUBTITLE, HISTORY_TITLE, PAST_SECTION, SHEET_MAX_HEIGHT } from '@/types/history/history-type';

// A sheet over the screen it was opened from, like the new-transaction one: the months so far,
// newest first. Picking one makes every screen show it.
export default function HistorySheet() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history } = useMonthlyHistory();
  const future = useFutureMonths();
  const { month, setMonth } = useSelectedMonth();
  const { kept, total } = countKeptMonths(history);

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
            <Icon name="close" size={22} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink">{HISTORY_TITLE}</Text>
        </View>

        <Text className="px-5 pb-3 text-[13px] text-muted text-center">{HISTORY_SUBTITLE(kept, total)}</Text>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {future.length > 0 && (
            <>
              <Text className="text-[11px] font-bold tracking-[1px] uppercase text-muted mt-1 mb-2">{FUTURE_SECTION}</Text>
              {[...future].reverse().map((entry) => (
                <FutureMonthRow
                  key={entry.month}
                  entry={entry}
                  selected={entry.month === month}
                  onPress={() => {
                    setMonth(entry.month);
                    router.back();
                  }}
                />
              ))}
              <Text className="text-[11px] font-bold tracking-[1px] uppercase text-muted mt-3 mb-2">{PAST_SECTION}</Text>
            </>
          )}
          {history.map((entry) => (
            <MonthRow
              key={entry.month}
              entry={entry}
              selected={entry.month === month}
              onPress={() => {
                setMonth(entry.month);
                router.back();
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
