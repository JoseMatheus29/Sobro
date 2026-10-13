import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { notifyDataChanged } from '@/db/events';
import { deleteGoal, deleteGoalEntry } from '@/db/goals';
import { useGoal } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import { type MovementKind } from '@/utils/goals-type';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import EmptyState from '@/app/components/ui/EmptyState';
import { CLOSE_LABEL, SHEET_DIM_COLOR, SHEET_TOP_GAP } from '@/types/registrationSpent/registrationSpent-type';
import GoalCard from '@/app/components/GoalCard';
import GoalFormModal from '@/app/components/GoalFormModal';
import MovementModal from '@/app/goal/components/MovementModal';
import MovementRow from '@/app/goal/components/MovementRow';
import {
  DELETE_ENTRY_CONFIRM,
  DELETE_GOAL_CONFIRM,
  DELETE_GOAL_LABEL,
  DEPOSIT_LABEL,
  EDIT_GOAL_LABEL,
  ENTRY_DELETED_TOAST,
  GOAL_DELETED_TOAST,
  GOAL_NOT_FOUND,
  HISTORY_EMPTY,
  HISTORY_TITLE,
  SHEET_HINT,
  WITHDRAW_LABEL,
} from '@/types/goal/goal-type';

// A sheet over Carteira: how a caixinha is going, putting money in and taking it out, and its history.
export default function GoalSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const db = useSQLiteContext();
  const { confirm, showToast } = useFeedback();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goal, entries, loading } = useGoal(Number(id));

  const [movement, setMovement] = useState<MovementKind | null>(null);
  const [editing, setEditing] = useState(false);

  const handleDeleteGoal = async () => {
    if (!goal || !(await confirm(DELETE_GOAL_CONFIRM(goal.name)))) return;
    await deleteGoal(db, goal.id);
    notifyDataChanged();
    showToast(GOAL_DELETED_TOAST);
    router.back();
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!(await confirm(DELETE_ENTRY_CONFIRM))) return;
    await deleteGoalEntry(db, entryId);
    notifyDataChanged();
    showToast(ENTRY_DELETED_TOAST);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable accessibilityLabel={CLOSE_LABEL} onPress={() => router.back()} style={{ height: insets.top + SHEET_TOP_GAP }} />
      <View className="flex-1 bg-canvas rounded-t-[28px] overflow-hidden">
        <View className="items-center pt-2.5">
          <View className="w-10 h-1 rounded-full bg-surface-dark" />
        </View>
        <View className="h-14 items-center justify-center">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel={CLOSE_LABEL}
            className="absolute left-3 w-11 h-11 rounded-[14px] bg-surface items-center justify-center"
          >
            <Icon name="close" size={22} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerClassName="px-5 pt-1"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {!goal && !loading && <EmptyState icon="savings" message={GOAL_NOT_FOUND} />}

          {goal && (
            <>
              <GoalCard goal={goal} />

              <View className="flex-row gap-3 mt-1.5">
                <TouchableOpacity
                  onPress={() => setMovement('deposit')}
                  activeOpacity={0.85}
                  className="flex-1 h-12 rounded-2xl flex-row items-center justify-center gap-1.5"
                  style={{ backgroundColor: colors.buttonGradient[0] }}
                >
                  <Icon name="add" size={20} color="#FFFFFF" />
                  <Text className="text-[15px] font-bold text-white">{DEPOSIT_LABEL}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMovement('withdraw')}
                  disabled={goal.saved <= 0}
                  activeOpacity={0.85}
                  className="flex-1 h-12 rounded-2xl flex-row items-center justify-center gap-1.5 bg-card border-[1.5px] border-surface-dark"
                  style={{ opacity: goal.saved <= 0 ? 0.45 : 1 }}
                >
                  <Icon name="remove" size={20} color={colors.primary.DEFAULT} />
                  <Text className="text-[15px] font-bold text-primary">{WITHDRAW_LABEL}</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-muted text-center mt-3 px-2">{SHEET_HINT}</Text>

              <View className="bg-card rounded-[20px] border border-surface px-4 mt-4">
                <Text className="text-base font-bold text-ink pt-4 pb-3">{HISTORY_TITLE}</Text>
                {entries.length === 0 ? (
                  <Text className="text-[13px] text-muted pb-4">{HISTORY_EMPTY}</Text>
                ) : (
                  entries.map((entry) => (
                    <MovementRow key={entry.id} entry={entry} onDelete={() => handleDeleteEntry(entry.id)} />
                  ))
                )}
              </View>

              <View className="flex-row items-center justify-center gap-8 mt-5">
                <TouchableOpacity onPress={() => setEditing(true)} className="flex-row items-center gap-1.5 h-10">
                  <Icon name="edit" size={16} color={colors.primary.DEFAULT} />
                  <Text className="text-[13px] font-semibold text-primary">{EDIT_GOAL_LABEL}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteGoal} className="flex-row items-center gap-1.5 h-10">
                  <Icon name="delete-outline" size={16} color={colors.expense} />
                  <Text className="text-[13px] font-semibold text-expense">{DELETE_GOAL_LABEL}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>

      {goal && movement && (
        <MovementModal visible kind={movement} goal={goal} onClose={() => setMovement(null)} />
      )}
      <GoalFormModal visible={editing} goal={goal} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />
    </View>
  );
}
