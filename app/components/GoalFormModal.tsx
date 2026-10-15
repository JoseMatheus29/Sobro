import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { createGoal, updateGoal } from '@/db/goals';
import { notifyDataChanged } from '@/db/events';
import { useCategoryColor, useColors } from '@/hooks/useColors';
import { useSaveKey } from '@/hooks/useSaveKey';
import { roundAmount } from '@/utils/apiInput';
import { errorMessage } from '@/utils/apiErrors';
import { GOAL_DEFAULT_MONTHS_AHEAD, GOAL_MAX_MONTHS_AHEAD, GOAL_NAME_MAX_LENGTH } from '@/utils/goals-type';
import { addMonths, currentMonthKey, monthsBetween, monthTitle } from '@/utils/month';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import {
  CANCEL_LABEL,
  EARLIER_MONTH_LABEL,
  EDIT_GOAL_TITLE,
  GOAL_COLOR_LABEL,
  GOAL_COLORS,
  GOAL_CREATED_TOAST,
  GOAL_DEADLINE_LABEL,
  GOAL_ICON_LABEL,
  GOAL_ICONS,
  GOAL_NAME_LABEL,
  GOAL_NAME_PLACEHOLDER,
  GOAL_SAVE_FAILED,
  GOAL_SAVED_TOAST,
  GOAL_TARGET_LABEL,
  GOAL_TARGET_PLACEHOLDER,
  GoalFormModalProps,
  LATER_MONTH_LABEL,
  NAME_REQUIRED,
  NEW_GOAL_TITLE,
  REMOVE_DEADLINE_LABEL,
  SAVE_LABEL,
  SAVING_LABEL,
  SET_DEADLINE_LABEL,
  TARGET_REQUIRED,
} from '@/types/goal/goal-type';

const LABEL_CLASS = 'text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5';
const INPUT_CLASS = 'bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5';

// Creates or edits a caixinha: a name, how much to save, an optional deadline, and how it looks.
export default function GoalFormModal({ visible, goal, onClose, onSaved }: GoalFormModalProps) {
  const colors = useColors();
  const recolor = useCategoryColor();
  const saveKey = useSaveKey();
  const { showToast } = useFeedback();
  const isEditing = !!goal;
  const currentMonth = currentMonthKey();

  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [targetMonth, setTargetMonth] = useState<string | null>(null);
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [icon, setIcon] = useState(GOAL_ICONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setName(goal?.name ?? '');
    setTarget(goal ? String(goal.targetAmount).replace('.', ',') : '');
    setTargetMonth(goal?.targetMonth ?? null);
    setColor(goal?.color ?? GOAL_COLORS[0]);
    setIcon(goal?.icon ?? GOAL_ICONS[0]);
  }, [visible, goal]);

  const stepMonth = (delta: number) => {
    if (targetMonth === null) return;
    const next = addMonths(targetMonth, delta);
    if (next < currentMonth || monthsBetween(currentMonth, next) > GOAL_MAX_MONTHS_AHEAD) return;
    setTargetMonth(next);
  };

  const handleSave = async () => {
    if (saving) return;
    const trimmed = name.trim();
    const amount = Number(target.replace(',', '.'));
    if (!trimmed) return setError(NAME_REQUIRED);
    if (!Number.isFinite(amount) || amount <= 0) return setError(TARGET_REQUIRED);

    setError(null);
    setSaving(true);
    try {
      const input = { name: trimmed, targetAmount: roundAmount(amount), targetMonth, color, icon };
      let id: number;
      if (goal) {
        await updateGoal(goal.id, input);
        id = goal.id;
      } else {
        id = await createGoal(input, saveKey.keyFor(input));
        saveKey.clear();
      }
      notifyDataChanged();
      onSaved(id);
      showToast(goal ? GOAL_SAVED_TOAST : GOAL_CREATED_TOAST(trimmed));
    } catch (failure) {
      // Inside the dialog: a toast would be drawn behind the Modal.
      setError(errorMessage(failure, GOAL_SAVE_FAILED));
    } finally {
      setSaving(false);
    }
  };

  const tone = recolor(color);
  const canStepBack = targetMonth !== null && targetMonth > currentMonth;
  const canStepForward = targetMonth !== null && monthsBetween(currentMonth, targetMonth) < GOAL_MAX_MONTHS_AHEAD;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/40 justify-center px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-card rounded-[24px] w-full" style={{ maxHeight: '90%' }}>
          <ScrollView contentContainerClassName="p-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text className="text-[15px] font-bold text-ink mb-4">{isEditing ? EDIT_GOAL_TITLE : NEW_GOAL_TITLE}</Text>

            <Text className={LABEL_CLASS}>{GOAL_NAME_LABEL}</Text>
            <TextInput
              className={INPUT_CLASS}
              placeholder={GOAL_NAME_PLACEHOLDER}
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
              maxLength={GOAL_NAME_MAX_LENGTH}
            />

            <Text className={LABEL_CLASS}>{GOAL_TARGET_LABEL}</Text>
            <TextInput
              className={INPUT_CLASS}
              placeholder={GOAL_TARGET_PLACEHOLDER}
              placeholderTextColor={colors.placeholder}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
            />

            <Text className={LABEL_CLASS}>{GOAL_DEADLINE_LABEL}</Text>
            {targetMonth === null ? (
              <TouchableOpacity
                onPress={() => setTargetMonth(addMonths(currentMonth, GOAL_DEFAULT_MONTHS_AHEAD))}
                activeOpacity={0.8}
                className="flex-row items-center gap-2 h-[50px] rounded-[14px] bg-canvas px-3.5 mb-3.5"
              >
                <Icon name="event" size={18} color={colors.primary.DEFAULT} />
                <Text className="text-[14px] font-semibold text-primary">{SET_DEADLINE_LABEL}</Text>
              </TouchableOpacity>
            ) : (
              <View className="flex-row items-center gap-1 h-[50px] rounded-[14px] bg-canvas px-1.5 mb-3.5">
                <TouchableOpacity
                  onPress={() => stepMonth(-1)}
                  disabled={!canStepBack}
                  accessibilityLabel={EARLIER_MONTH_LABEL}
                  className="w-9 h-9 items-center justify-center"
                  style={{ opacity: canStepBack ? 1 : 0.3 }}
                >
                  <Icon name="chevron-left" size={22} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
                <Text className="flex-1 text-center text-[14px] font-semibold text-ink">{monthTitle(targetMonth)}</Text>
                <TouchableOpacity
                  onPress={() => stepMonth(1)}
                  disabled={!canStepForward}
                  accessibilityLabel={LATER_MONTH_LABEL}
                  className="w-9 h-9 items-center justify-center"
                  style={{ opacity: canStepForward ? 1 : 0.3 }}
                >
                  <Icon name="chevron-right" size={22} color={colors.primary.DEFAULT} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTargetMonth(null)}
                  accessibilityLabel={REMOVE_DEADLINE_LABEL}
                  className="w-9 h-9 items-center justify-center"
                >
                  <Icon name="close" size={18} color={colors.subtle} />
                </TouchableOpacity>
              </View>
            )}

            <Text className={LABEL_CLASS}>{GOAL_COLOR_LABEL}</Text>
            <View className="flex-row flex-wrap gap-2.5 mb-3.5">
              {GOAL_COLORS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => setColor(option)}
                  accessibilityState={{ selected: color === option }}
                  className="w-9 h-9 rounded-full"
                  style={{ backgroundColor: recolor(option), borderWidth: color === option ? 2 : 0, borderColor: colors.ink }}
                />
              ))}
            </View>

            <Text className={LABEL_CLASS}>{GOAL_ICON_LABEL}</Text>
            <View className="flex-row flex-wrap gap-2.5 mb-4">
              {GOAL_ICONS.map((option) => {
                const active = icon === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setIcon(option)}
                    accessibilityState={{ selected: active }}
                    className="w-11 h-11 rounded-[14px] items-center justify-center"
                    style={{
                      backgroundColor: active ? `${tone}1F` : colors.canvas,
                      borderWidth: 1.5,
                      borderColor: active ? tone : 'transparent',
                    }}
                  >
                    <Icon name={option} size={22} color={active ? tone : colors.subtle} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {error && <Text className="text-xs text-expense mb-3">{error}</Text>}

            <View className="flex-row gap-3">
              <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
                <Text className="text-muted font-semibold text-sm">{CANCEL_LABEL}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                className="flex-1 h-12 rounded-[14px] items-center justify-center"
                style={{ backgroundColor: saving ? colors.disabledGradient[0] : colors.buttonGradient[0] }}
              >
                <Text className="text-white font-semibold text-sm">{saving ? SAVING_LABEL : SAVE_LABEL}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
