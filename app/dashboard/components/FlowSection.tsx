import React from 'react';
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { formatMoney, formatSignedPercent } from '@/utils/format';
import {
  FLOW_BAR_MIN_PERCENT,
  FLOW_COMPARED_LABEL,
  FLOW_EXPENSE_LABEL,
  FLOW_INCOME_LABEL,
  FLOW_NO_INCOME_LABEL,
  FLOW_THIS_MONTH_LABEL,
  FLOW_TITLE,
  FLOW_USE_LABEL,
  FlowSectionProps,
} from '@/types/dashboard/dashboard-type';
import FlowCard from '@/app/dashboard/components/FlowCard';

// What came in and what went out this month, apart from the balance.
export default function FlowSection({ summary, monthLabel }: FlowSectionProps) {
  const colors = useColors();
  const { income, expense, incomeChange, incomeUse } = summary;
  const barPercent = incomeUse === null || incomeUse <= 0 ? 0 : Math.min(100, Math.max(FLOW_BAR_MIN_PERCENT, incomeUse * 100));

  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[17px] font-bold text-ink">{FLOW_TITLE}</Text>
        <Text className="text-[11px] font-semibold tracking-[1px] uppercase text-muted">{monthLabel}</Text>
      </View>

      <View className="flex-row gap-3">
        <FlowCard
          icon="south-west"
          color={colors.income}
          label={FLOW_INCOME_LABEL}
          value={formatMoney(income)}
          badge={incomeChange === null ? undefined : formatSignedPercent(incomeChange, 0)}
          badgeColor={incomeChange !== null && incomeChange < 0 ? colors.expense : colors.income}
        >
          <Text className="text-[11px] text-subtle">
            {incomeChange === null ? FLOW_THIS_MONTH_LABEL : FLOW_COMPARED_LABEL}
          </Text>
        </FlowCard>

        <FlowCard
          icon="north-east"
          color={colors.expense}
          label={FLOW_EXPENSE_LABEL}
          value={formatMoney(expense)}
          badge={incomeUse === null ? undefined : FLOW_USE_LABEL(Math.round(incomeUse * 100))}
        >
          {incomeUse === null ? (
            <Text className="text-[11px] text-subtle">{FLOW_NO_INCOME_LABEL}</Text>
          ) : (
            <View className="h-1.5 rounded-full overflow-hidden bg-surface">
              <View
                className="h-full rounded-full"
                style={{ width: `${barPercent}%`, backgroundColor: colors.expense }}
              />
            </View>
          )}
        </FlowCard>
      </View>
    </View>
  );
}
