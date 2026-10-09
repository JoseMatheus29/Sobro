import React from 'react';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardHeaderProps, GREETING } from '../dashboard-type';

// Only the greeting; the summary card overlaps its lower edge.
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
      <Text className="text-white text-2xl font-extrabold tracking-tight">
        {firstName ? `${GREETING}, ${firstName}` : GREETING}
      </Text>
    </LinearGradient>
  );
}
