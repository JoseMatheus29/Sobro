import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { palette } from '@/constants/palette';
import { tint } from '@/utils/color';
import { formatMoney } from '@/utils/format';
import { monthTitle } from '@/utils/month';
import { BUDGET_WARN_AT } from '../../dashboard/cardBalance-type';
import {
  BUDGET_USE_LABEL,
  CURRENT_BADGE,
  EXPENSE_LABEL,
  INCOME_LABEL,
  KEPT_LABEL,
  MISSING_LABEL,
  MonthRowProps,
  NO_BUDGET_LABEL,
} from '../history-type';

// One month: what was left, what came in and went out, and how much of that month's budget was used.
export default function MonthRow({ entry, selected, onPress }: MonthRowProps) {
  const kept = entry.net >= 0;
  const netColor = kept ? palette.income : palette.expense;
  const use = entry.budgetUse;
  const useColor = use !== null && use >= BUDGET_WARN_AT ? palette.expense : palette.income;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-[20px] border p-4 mb-2.5 shadow-sm shadow-black/5 elevation-2"
      style={{ borderColor: selected ? palette.primary.DEFAULT : palette.surface.DEFAULT }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-ink">{monthTitle(entry.month)}</Text>
          {entry.current && (
            <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: tint(palette.primary.DEFAULT) }}>
              <Text className="text-[10px] font-bold text-primary">{CURRENT_BADGE}</Text>
            </View>
          )}
        </View>
        <View className="items-end">
          <Text className="text-base font-extrabold" style={{ color: netColor }}>
            {kept ? '+ ' : '- '}{formatMoney(Math.abs(entry.net))}
          </Text>
          <Text className="text-[11px] text-subtle">{kept ? KEPT_LABEL : MISSING_LABEL}</Text>
        </View>
      </View>

      <Text className="text-xs text-muted mt-1">
        {INCOME_LABEL} {formatMoney(entry.income)} · {EXPENSE_LABEL} {formatMoney(entry.expense)}
      </Text>

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
