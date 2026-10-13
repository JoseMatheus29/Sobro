import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { addGoalEntry } from '@/db/goals';
import { notifyDataChanged } from '@/db/events';
import { useColors } from '@/hooks/useColors';
import { formatMoney } from '@/utils/format';
import { movementProblem } from '@/utils/goals';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import {
  AVAILABLE_LABEL,
  CANCEL_LABEL,
  DEPOSIT_SUBMIT,
  DEPOSIT_TITLE,
  DEPOSITED_TOAST,
  EXCEEDS,
  GOAL_REACHED_TOAST,
  INVALID_AMOUNT,
  MOVEMENT_AMOUNT_LABEL,
  MOVEMENT_PLACEHOLDER,
  MovementModalProps,
  WITHDRAW_SUBMIT,
  WITHDRAW_TITLE,
  WITHDREW_TOAST,
} from '@/types/goal/goal-type';

// Puts money in a caixinha or takes it out. Only what is in it can come out.
export default function MovementModal({ visible, kind, goal, onClose }: MovementModalProps) {
  const colors = useColors();
  const db = useSQLiteContext();
  const { showToast } = useFeedback();
  const deposit = kind === 'deposit';

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setError(null);
  }, [visible]);

  const value = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(value) && value > 0;
  const shown = valid ? formatMoney(value).replace('R$ ', '') : '';

  const handleSubmit = async () => {
    if (saving) return;
    const problem = movementProblem(kind, value, goal.saved);
    if (problem === 'invalid') return setError(INVALID_AMOUNT);
    if (problem === 'exceeds') return setError(EXCEEDS(formatMoney(goal.saved)));

    setSaving(true);
    await addGoalEntry(db, { goalId: goal.id, amount: deposit ? value : -value, occurredAt: new Date().toISOString() });
    notifyDataChanged();
    setSaving(false);
    onClose();

    const reached = deposit && goal.saved < goal.targetAmount && goal.saved + value >= goal.targetAmount;
    if (reached) showToast(GOAL_REACHED_TOAST(goal.name));
    else showToast(deposit ? DEPOSITED_TOAST(shown, goal.name) : WITHDREW_TOAST(shown, goal.name));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/40 items-center justify-center px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-card rounded-[24px] p-5 w-full">
          <Text className="text-[15px] font-bold text-ink mb-4" numberOfLines={2}>
            {deposit ? DEPOSIT_TITLE(goal.name) : WITHDRAW_TITLE(goal.name)}
          </Text>

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">{MOVEMENT_AMOUNT_LABEL}</Text>
          <View className="flex-row items-center bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5">
            <Text className="text-[22px] font-extrabold text-ink mr-2">R$</Text>
            <TextInput
              className="flex-1 text-[22px] font-extrabold text-ink py-2"
              placeholder={MOVEMENT_PLACEHOLDER}
              placeholderTextColor={colors.placeholder}
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setError(null);
              }}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          {!deposit && <Text className="text-xs text-muted mt-2">{AVAILABLE_LABEL(formatMoney(goal.saved))}</Text>}
          {error && <Text className="text-xs text-expense mt-2">{error}</Text>}

          <View className="flex-row gap-3 mt-5">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
              <Text className="text-muted font-semibold text-sm">{CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={saving}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: !valid || saving ? colors.disabledGradient[0] : colors.buttonGradient[0] }}
            >
              <Text className="text-white font-semibold text-sm">{deposit ? DEPOSIT_SUBMIT(shown) : WITHDRAW_SUBMIT(shown)}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
