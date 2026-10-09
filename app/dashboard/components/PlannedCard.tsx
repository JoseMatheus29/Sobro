import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { formatMoney } from '@/utils/format';
import {
  BUDGET_BAR_MIN_PERCENT,
  BUDGET_CEILING_LABEL,
  BUDGET_LABEL,
  BUDGET_WARN_AT,
  BalanceCardProps,
  NO_BUDGET_PAST_LABEL,
  PLANNED_COMMITTED_LABEL,
  PLANNED_COUNT_LABEL,
  PLANNED_OUT_LABEL,
  PLANNED_TAG,
  PLANNED_USE_LABEL,
} from '../cardBalance-type';

// What is already committed in a month that has not started. It is not a balance: nothing happened yet.
export default function PlannedCard({ summary, budget }: Pick<BalanceCardProps, 'summary' | 'budget'>) {
  const use = summary.budgetUse;
  const hasBudget = budget !== null && use !== null;
  const color = hasBudget && use >= BUDGET_WARN_AT ? palette.expense : palette.income;
  const fillPercent = !hasBudget || use <= 0 ? 0 : Math.min(100, Math.max(BUDGET_BAR_MIN_PERCENT, use * 100));

  return (
    <View className="bg-white rounded-[24px] p-6 border border-surface-dark shadow-sm shadow-black/5 elevation-2">
      <View className="flex-row items-center gap-1 self-start rounded-lg px-2 py-[3px]" style={{ backgroundColor: `${palette.muted}20` }}>
        <Icon name="schedule" size={13} color={palette.muted} />
        <Text className="text-[11px] font-bold tracking-[0.4px] text-muted">{PLANNED_TAG}</Text>
      </View>

      <Text className="text-xs text-primary-lighter font-semibold tracking-[0.8px] uppercase mt-3 mb-1">
        {PLANNED_OUT_LABEL}
      </Text>
      <Text className="text-[32px] font-extrabold text-ink tracking-tight">{formatMoney(summary.expense)}</Text>
      <Text className="text-xs text-muted mt-2">{PLANNED_COUNT_LABEL(summary.transactionCount)}</Text>

      <View className="h-[1px] bg-surface-dark my-4" />

      {hasBudget ? (
        <View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-medium text-muted">{BUDGET_LABEL}</Text>
            <Text className="text-[13px] font-bold" style={{ color }}>{PLANNED_USE_LABEL(Math.round(use * 100))}</Text>
          </View>
          <View className="h-2 rounded-full overflow-hidden mt-2.5" style={{ backgroundColor: palette.surface.DEFAULT }}>
            <View className="h-full rounded-full" style={{ width: `${fillPercent}%`, backgroundColor: color }} />
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-muted">{PLANNED_COMMITTED_LABEL}: {formatMoney(summary.expense)}</Text>
            <Text className="text-xs text-muted">{BUDGET_CEILING_LABEL}: {formatMoney(budget)}</Text>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center gap-2">
          <Icon name="flag" size={16} color={palette.subtle} />
          <Text className="flex-1 text-[13px] font-medium text-muted">{NO_BUDGET_PAST_LABEL}</Text>
        </View>
      )}
    </View>
  );
}
