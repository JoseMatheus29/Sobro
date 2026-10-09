import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { tint } from '@/utils/color';
import { FlowCardProps } from '../dashboard-type';

// One side of the cash flow: what moved, with a pill for how it compares and room for a footer.
export default function FlowCard({ icon, color, label, value, badge, badgeColor, children }: FlowCardProps) {
  return (
    <View className="flex-1 bg-white rounded-[20px] border border-surface p-4 shadow-sm shadow-black/5 elevation-2">
      <View className="flex-row items-center justify-between">
        <View className="w-9 h-9 rounded-[12px] items-center justify-center" style={{ backgroundColor: tint(color) }}>
          <Icon name={icon} size={18} color={color} />
        </View>
        {badge && (
          <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: tint(badgeColor ?? color) }}>
            <Text className="text-[10px] font-bold" style={{ color: badgeColor ?? color }}>{badge}</Text>
          </View>
        )}
      </View>

      <Text className="text-xs text-muted mt-4">{label}</Text>
      <Text numberOfLines={1} adjustsFontSizeToFit className="text-lg font-extrabold text-ink mt-0.5">
        {value}
      </Text>

      <View className="mt-2.5">{children}</View>
    </View>
  );
}
