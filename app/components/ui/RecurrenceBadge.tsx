import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { tint } from '@/utils/color';

// "4/10" on an installment, "Todo mês" on a fixed monthly expense.
export default function RecurrenceBadge({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View
      className="flex-row items-center gap-[3px] rounded-[7px] px-[7px] py-[2px]"
      style={{ backgroundColor: tint(colors.primary.DEFAULT) }}
    >
      <Icon name="autorenew" size={11} color={colors.primary.DEFAULT} />
      <Text className="text-[11px] font-bold leading-[14px] text-primary">{label}</Text>
    </View>
  );
}
