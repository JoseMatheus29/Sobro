import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MonthPill from '../../components/month/MonthPill';
import { DashboardHeaderProps, GREETING } from '../dashboard-type';

// The greeting on the left and the month on the right, on one line; the summary card overlaps
// the lower edge.
export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0];
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#1E3F7A', '#3161B2', '#4A74BB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-16 px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text numberOfLines={1} className="flex-1 text-white text-2xl font-extrabold tracking-tight">
          {firstName ? `${GREETING}, ${firstName}` : GREETING}
        </Text>
        <MonthPill />
      </View>
    </LinearGradient>
  );
}
