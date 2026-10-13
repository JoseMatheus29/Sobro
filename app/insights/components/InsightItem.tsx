import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { insightToneColors, InsightItemProps } from '@/types/insights/insights-type';
import { useColors } from '@/hooks/useColors';

export default function InsightItem({ insight }: InsightItemProps) {
  const colors = useColors();
  const color = insightToneColors(colors)[insight.tone];

  return (
    <View className="flex-row gap-3.5 bg-card rounded-[20px] border border-surface p-4 mb-3 shadow-sm shadow-black/5 elevation-2">
      <View
        className="w-11 h-11 rounded-[14px] items-center justify-center"
        style={{ backgroundColor: `${color}1F` }}
      >
        <Icon name={insight.icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-ink">{insight.title}</Text>
        <Text className="text-[13px] leading-[19px] text-muted mt-1">{insight.tip}</Text>
      </View>
    </View>
  );
}
