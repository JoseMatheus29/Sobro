import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { INSIGHT_TONE_COLOR } from '../../insights/insights-type';
import { INSIGHT_COUNT_LABEL, InsightHighlightProps } from '../dashboard-type';

// One line of what the numbers say, opening the full list of insights and tips.
export default function InsightHighlight({ insight, count, onPress }: InsightHighlightProps) {
  const color = INSIGHT_TONE_COLOR[insight.tone];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-row items-center gap-3.5 bg-white rounded-[20px] border border-surface px-4 py-3.5 shadow-sm shadow-black/5 elevation-2"
    >
      <View className="w-10 h-10 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
        <Icon name={insight.icon} size={20} color={color} />
      </View>

      <View className="flex-1">
        <Text numberOfLines={2} className="text-sm font-bold leading-5 text-ink">{insight.title}</Text>
        <Text className="text-xs text-muted mt-0.5">{INSIGHT_COUNT_LABEL(count)}</Text>
      </View>

      <Icon name="chevron-right" size={20} color={palette.subtle} />
    </TouchableOpacity>
  );
}
