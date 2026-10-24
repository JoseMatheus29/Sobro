import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { budgetColor } from '@/utils/budget';
import { tint } from '@/utils/color';
import { formatMoney, formatSignedMoney } from '@/utils/format';
import {
  BALANCE_LABEL,
  BalanceCardProps,
  BUDGET_BAR_MIN_PERCENT,
  BUDGET_CEILING_LABEL,
  BUDGET_LABEL,
  BUDGET_OVER_LABEL,
  BUDGET_REMAINING_LABEL,
  BUDGET_SPENT_LABEL,
  COMPARED_LABEL,
  NO_BUDGET_LABEL,
  NO_BUDGET_PAST_LABEL,
  TRANSACTION_COUNT_LABEL,
} from '@/types/dashboard/cardBalance-type';

// The balance of the month, how it compares with the last one, and how much of the budget is spent.
export const CardBalance: React.FC<BalanceCardProps> = ({ summary, budget, onPressBudget }) => {
  const colors = useColors();
  // The label takes the purple of "someone else's finances" while a profile of someone else is open.
  const { active } = useProfiles();
  const { net, netChange } = summary;
  const better = netChange !== null && netChange >= 0;
  const changeColor = better ? colors.income : colors.expense;

  const use = summary.budgetUse;
  const hasBudget = budget !== null && use !== null;
  const over = hasBudget && use > 1 ? summary.expense - budget : 0;
  const barColor = budgetColor(use, colors);
  const fillPercent = !hasBudget || use <= 0 ? 0 : Math.min(100, Math.max(BUDGET_BAR_MIN_PERCENT, use * 100));
  const remaining = hasBudget ? Math.max(0, Math.round((1 - use) * 100)) : 0;

  return (
    // Plain white: the gray-blue gradient the card used to have read as gray once it got taller.
    <View className="bg-card rounded-[24px] p-6 border border-surface-dark shadow-sm shadow-black/5 elevation-2">
      {/* Saldo principal */}
      <Text
        className="text-xs text-primary-lighter font-semibold tracking-[0.8px] uppercase mb-1"
        style={active ? { color: colors.managed } : undefined}
      >
        {BALANCE_LABEL}
      </Text>
      <Text className="text-[32px] font-extrabold text-ink tracking-tight">
        {formatMoney(net)}
      </Text>

      <View className="flex-row flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2.5">
        {netChange !== null && (
          <View
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: tint(changeColor) }}
          >
            <Icon name={better ? 'arrow-upward' : 'arrow-downward'} size={12} color={changeColor} />
            <Text className="text-xs font-bold" style={{ color: changeColor }}>
              {formatSignedMoney(netChange)} {COMPARED_LABEL}
            </Text>
          </View>
        )}
        <Text className="text-xs text-muted">{TRANSACTION_COUNT_LABEL(summary.transactionCount)}</Text>
      </View>

      {/* Divisor */}
      <View className="h-[1px] bg-surface-dark my-4" />

      {/* Orçamento */}
      {hasBudget ? (
        <View>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] font-medium text-muted">{BUDGET_LABEL}</Text>
            <Text className="text-[13px] font-bold" style={{ color: barColor }}>
              {over > 0 ? BUDGET_OVER_LABEL(formatMoney(over)) : BUDGET_REMAINING_LABEL(remaining)}
            </Text>
          </View>

          <View className="h-2 rounded-full overflow-hidden mt-2.5" style={{ backgroundColor: colors.surface.DEFAULT }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${fillPercent}%`, backgroundColor: barColor }}
            />
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-xs text-muted">
              {BUDGET_SPENT_LABEL}: {formatMoney(summary.expense)}
            </Text>
            <Text className="text-xs text-muted">
              {BUDGET_CEILING_LABEL}: {formatMoney(budget)}
            </Text>
          </View>
        </View>
      ) : onPressBudget ? (
        <TouchableOpacity onPress={onPressBudget} activeOpacity={0.8} className="flex-row items-center gap-2">
          <Icon name="flag" size={16} color={colors.primary.DEFAULT} />
          <Text className="flex-1 text-[13px] font-medium text-muted">{NO_BUDGET_LABEL}</Text>
          <Icon name="chevron-right" size={18} color={colors.subtle} />
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center gap-2">
          <Icon name="flag" size={16} color={colors.subtle} />
          <Text className="flex-1 text-[13px] font-medium text-muted">{NO_BUDGET_PAST_LABEL}</Text>
        </View>
      )}
    </View>
  );
};

export default CardBalance;
