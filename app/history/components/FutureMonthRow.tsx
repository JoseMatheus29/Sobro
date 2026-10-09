import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { palette } from '@/constants/palette';
import { formatMoney } from '@/utils/format';
import { monthTitle } from '@/utils/month';
import { PLANNED_LABEL } from '../../components/cardHorizontal-type';
import { BUDGET_WARN_AT } from '../../dashboard/cardBalance-type';
import {
  BUDGET_USE_LABEL,
  COMMITTED_LABEL,
  FUTURE_COUNT_LABEL,
  FutureMonthRowProps,
  NO_BUDGET_LABEL,
} from '../history-type';

// A month that has not started: what is already committed in it. Dashed, because none of it happened yet.
export default function FutureMonthRow({ entry, selected, onPress }: FutureMonthRowProps) {
  const use = entry.budgetUse;
  const useColor = use !== null && use >= BUDGET_WARN_AT ? palette.expense : palette.income;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="rounded-[20px] border p-4 mb-2.5"
      style={{
        borderStyle: 'dashed',
        borderColor: selected ? palette.primary.DEFAULT : palette.subtle,
        backgroundColor: palette.canvas,
      }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-ink">{monthTitle(entry.month)}</Text>
          <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${palette.muted}20` }}>
            <Text className="text-[10px] font-bold text-muted">{PLANNED_LABEL}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-base font-extrabold text-muted">- {formatMoney(entry.total)}</Text>
          <Text className="text-[11px] text-subtle">{COMMITTED_LABEL}</Text>
        </View>
      </View>

      <Text className="text-xs text-muted mt-1">{FUTURE_COUNT_LABEL(entry.count, entry.installments)}</Text>

      <View className="flex-row items-center gap-2.5 mt-2.5">
        <View className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: palette.surface.DEFAULT }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${use === null ? 0 : Math.min(100, use * 100)}%`, backgroundColor: useColor }}
          />
        </View>
        <Text className="text-[11px] font-bold" style={{ color: use === null ? palette.subtle : useColor }}>
          {use === null ? NO_BUDGET_LABEL : BUDGET_USE_LABEL(Math.round(use * 100))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
