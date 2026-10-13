import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { tint } from '@/utils/color';
import { formatMoney, formatShortDate } from '@/utils/format';
import { DELETE_ENTRY_LABEL, DEPOSIT_ENTRY_LABEL, MovementRowProps, WITHDRAW_ENTRY_LABEL } from '@/types/goal/goal-type';

// One thing put in or taken out of a caixinha.
export default function MovementRow({ entry, onDelete }: MovementRowProps) {
  const colors = useColors();
  const deposit = entry.amount >= 0;
  const color = deposit ? colors.income : colors.expense;

  return (
    <View className="flex-row items-center gap-3 py-3 border-t border-line">
      <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: tint(color) }}>
        <Icon name={deposit ? 'arrow-downward' : 'arrow-upward'} size={16} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-ink">{deposit ? DEPOSIT_ENTRY_LABEL : WITHDRAW_ENTRY_LABEL}</Text>
        <Text className="text-xs text-muted mt-0.5">{formatShortDate(entry.occurredAt)}</Text>
      </View>
      <Text className="text-[14px] font-bold" style={{ color }}>
        {deposit ? '+' : '-'} {formatMoney(Math.abs(entry.amount))}
      </Text>
      <TouchableOpacity onPress={onDelete} accessibilityLabel={DELETE_ENTRY_LABEL} className="w-8 h-8 items-center justify-center">
        <Icon name="delete-outline" size={18} color={colors.subtle} />
      </TouchableOpacity>
    </View>
  );
}
