import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { formatMoney } from '@/utils/format';
import { freeBalance, totalReserved } from '@/utils/goals';
import GoalCard from '@/app/components/GoalCard';
import {
  CREATE_GOAL_LABEL,
  FREE_LABEL,
  GOALS_EMPTY_TEXT,
  GOALS_EMPTY_TITLE,
  GOALS_TITLE,
  GoalsSectionProps,
  NEW_GOAL_LABEL,
  OVER_RESERVED_HINT,
  RESERVED_LABEL,
} from '@/types/goal/goal-type';

// The caixinhas in Carteira: each one with its progress, and how much of the money in the accounts is
// set aside for them.
export default function GoalsSection({ goals, accountBalances, onNew, onOpen }: GoalsSectionProps) {
  const colors = useColors();
  const reserved = totalReserved(goals);
  const free = freeBalance(accountBalances, reserved);

  return (
    <View className="mx-4 mb-7">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-base font-bold text-ink">{GOALS_TITLE}</Text>
        {goals.length > 0 && (
          <TouchableOpacity onPress={onNew} activeOpacity={0.7} className="flex-row items-center gap-1">
            <Icon name="add" size={18} color={colors.primary.DEFAULT} />
            <Text className="text-[13px] font-bold text-primary">{NEW_GOAL_LABEL}</Text>
          </TouchableOpacity>
        )}
      </View>

      {goals.length === 0 ? (
        <View className="bg-card rounded-[20px] border border-dashed border-surface-dark p-5 items-center">
          <View className="w-11 h-11 rounded-[14px] bg-primary/10 items-center justify-center mb-3">
            <Icon name="savings" size={22} color={colors.primary.DEFAULT} />
          </View>
          <Text className="text-[15px] font-bold text-ink text-center">{GOALS_EMPTY_TITLE}</Text>
          <Text className="text-[13px] leading-[19px] text-muted text-center mt-1.5">{GOALS_EMPTY_TEXT}</Text>
          <TouchableOpacity
            onPress={onNew}
            activeOpacity={0.85}
            className="h-11 px-5 rounded-[14px] items-center justify-center mt-4"
            style={{ backgroundColor: colors.buttonGradient[0] }}
          >
            <Text className="text-white font-semibold text-sm">{CREATE_GOAL_LABEL}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onPress={() => onOpen(goal.id)} />
          ))}
          <View className="flex-row items-center justify-between px-1 mt-0.5">
            <Text className="text-xs text-muted">
              {RESERVED_LABEL}: <Text className="font-bold text-ink">{formatMoney(reserved)}</Text>
            </Text>
            <Text className="text-xs text-muted">
              {FREE_LABEL}:{' '}
              <Text className="font-bold" style={{ color: free < 0 ? colors.warning : colors.ink }}>
                {formatMoney(free)}
              </Text>
            </Text>
          </View>
          {free < 0 && <Text className="text-xs mt-1.5 px-1" style={{ color: colors.warning }}>{OVER_RESERVED_HINT}</Text>}
        </>
      )}
    </View>
  );
}
