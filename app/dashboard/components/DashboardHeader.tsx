import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MonthPill from '@/app/components/month/MonthPill';
import { DashboardHeaderProps, GREETING } from '@/types/dashboard/dashboard-type';
import { useColors } from '@/hooks/useColors';

// The greeting on the left and the month on the right, on one line; the summary card overlaps
// the lower edge.
export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const colors = useColors();
  const firstName = userName?.trim().split(/\s+/)[0];
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-16 px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text numberOfLines={1} className="flex-1 text-headerInk text-2xl font-extrabold tracking-tight">
          {firstName ? `${GREETING}, ${firstName}` : GREETING}
        </Text>
        <MonthPill />
      </View>
    </LinearGradient>
  );
}
