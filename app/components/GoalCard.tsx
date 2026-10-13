import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useCategoryColor, useColors } from '@/hooks/useColors';
import { formatMoney } from '@/utils/format';
import { goalProgress } from '@/utils/goals';
import { monthKeyWithYear } from '@/utils/month';
import {
  GOAL_DEADLINE,
  GOAL_MISSING,
  GOAL_OVERDUE,
  GOAL_PROGRESS,
  GOAL_REACHED,
  GOAL_SUGGESTION,
  GoalCardProps,
} from '@/types/goal/goal-type';

// One caixinha: what is in it against what it should have, and what is left to do.
export default function GoalCard({ goal, onPress }: GoalCardProps) {
  const colors = useColors();
  const color = useCategoryColor()(goal.color);
  const progress = goalProgress(goal, new Date());
  const barColor = progress.reached ? colors.income : color;

  let status = GOAL_MISSING(formatMoney(progress.remaining));
  let statusColor = colors.muted;
  if (progress.reached) {
    status = GOAL_REACHED;
    statusColor = colors.income;
  } else if (progress.overdue && goal.targetMonth) {
    status = GOAL_OVERDUE(monthKeyWithYear(goal.targetMonth), formatMoney(progress.remaining));
    statusColor = colors.warning;
  } else if (progress.suggestedMonthly !== null && goal.targetMonth) {
    status = GOAL_SUGGESTION(formatMoney(progress.suggestedMonthly), monthKeyWithYear(goal.targetMonth));
  } else if (goal.targetMonth) {
    status = GOAL_DEADLINE(monthKeyWithYear(goal.targetMonth));
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
      className="bg-card rounded-[20px] border border-surface p-4 mb-2.5 shadow-sm shadow-black/5 elevation-2"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-11 h-11 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${color}1F` }}>
          <Icon name={goal.icon} size={22} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{goal.name}</Text>
          <Text className="text-xs text-muted mt-0.5">
            {GOAL_PROGRESS(formatMoney(progress.saved), formatMoney(progress.target))}
          </Text>
        </View>
        <Text className="text-sm font-extrabold text-ink">{progress.percent}%</Text>
      </View>

      <View className="h-1.5 rounded-full overflow-hidden mt-3" style={{ backgroundColor: colors.surface.DEFAULT }}>
        <View className="h-full rounded-full" style={{ width: `${progress.fraction * 100}%`, backgroundColor: barColor }} />
      </View>

      <Text className="text-xs font-medium mt-2" style={{ color: statusColor }}>{status}</Text>
    </TouchableOpacity>
  );
}
