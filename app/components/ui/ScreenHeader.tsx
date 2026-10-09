import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ArrowBack from '../arrowBack';

interface ScreenHeaderProps {
  title: string;
  rightComponent?: React.ReactNode;
  children?: React.ReactNode;
  gradientColors?: [string, string, string];
  hideBack?: boolean;
}

export default function ScreenHeader({
  title,
  rightComponent,
  children,
  gradientColors = ['#1E3F7A', '#3161B2', '#4A74BB'],
  hideBack = false
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-[52px] px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center gap-3">
          <Text className="text-white text-xl font-bold">{title}</Text>
        </View>
        {rightComponent}
      </View>
      {children}
    </LinearGradient>
  );
}
