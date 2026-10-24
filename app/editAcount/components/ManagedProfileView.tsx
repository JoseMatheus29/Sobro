import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import ProfileFormModal from '@/app/components/profile/ProfileFormModal';
import SideBar from '@/app/components/sidebar';
import GradientButton from '@/app/components/ui/GradientButton';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import BackupCard from '@/app/editAcount/components/BackupCard';
import DeleteProfileModal from '@/app/editAcount/components/DeleteProfileModal';
import ProfileHeader from '@/app/editAcount/components/ProfileHeader';
import { setBudgetFrom } from '@/db/budgets';
import { notifyDataChanged } from '@/db/events';
import { useBudgetEntries } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { KEYBOARD_AVOIDING_BEHAVIOR } from '@/types/components/ui/keyboard-type';
import { SCROLL_PADDING_WITH_SIDEBAR } from '@/types/components/sidebar-type';
import {
  BUDGET_CARD_TITLE,
  BUDGET_HINT,
  BUDGET_SAVE_LABEL,
  BUDGET_SAVED_TOAST,
  PROFILE_SAVE_FAILED_TITLE,
} from '@/types/editAcount/editAcount-type';
import {
  MANAGED_CARD_TEXT,
  MANAGED_CARD_TITLE,
  MANAGED_HEADER_TITLE,
  PROFILE_MENU_DELETE,
  PROFILE_MENU_RENAME,
  PROFILE_RENAMED_TOAST,
} from '@/types/profiles/profiles-type';
import { errorToast } from '@/utils/apiErrors';
import { roundAmount } from '@/utils/apiInput';
import { budgetForMonth } from '@/utils/budget';
import { tint } from '@/utils/color';
import { currentMonthKey } from '@/utils/month';

// Perfil while a profile of someone else is open: what belongs to that profile (its name, budget and backup) and the way
// to rename or delete it. What belongs to the person's own account (their name, the look of the app, the reminders, signing
// out) is on their own Perfil, one tap away on the banner.
export default function ManagedProfileView() {
  const colors = useColors();
  const { showToast } = useFeedback();
  const { active } = useProfiles();
  const { entries: budgetEntries } = useBudgetEntries();
  const currentBudget = budgetForMonth(budgetEntries, currentMonthKey());

  const [budget, setBudget] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setBudget(currentBudget !== null ? String(currentBudget) : '');
  }, [currentBudget]);

  if (!active) return null;

  const handleSaveBudget = async () => {
    const typed = budget ? Number(budget.replace(',', '.')) : null;
    const next = typed !== null && Number.isFinite(typed) && typed > 0 ? roundAmount(typed) : null;
    // Only a real change starts a new budget.
    if (next === currentBudget) return;
    try {
      await setBudgetFrom(currentMonthKey(), next);
    } catch (failure) {
      showToast(errorToast(failure, PROFILE_SAVE_FAILED_TITLE));
      return;
    }
    await notifyDataChanged();
    showToast(BUDGET_SAVED_TOAST);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={KEYBOARD_AVOIDING_BEHAVIOR}>
      <ScreenScroll bottomPadding={SCROLL_PADDING_WITH_SIDEBAR} keyboardShouldPersistTaps="handled">
        <ProfileHeader name={active.name} title={MANAGED_HEADER_TITLE(active.name)} />

        <View className="px-5 -mt-7">
          <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
            <View className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
                <Icon name="account-balance-wallet" size={16} color={colors.primary.DEFAULT} />
              </View>
              <Text className="text-[15px] font-bold text-ink">{BUDGET_CARD_TITLE}</Text>
            </View>
            <View className="flex-row items-center bg-canvas rounded-2xl border-[1.5px] border-line px-3.5 h-[52px]">
              <Icon name="flag" size={18} color={colors.subtle} />
              <TextInput
                className="flex-1 ml-2.5 text-[15px] text-ink"
                placeholder="0,00"
                placeholderTextColor={colors.placeholder}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                accessibilityLabel={BUDGET_CARD_TITLE}
              />
            </View>
            <Text className="text-xs text-muted mt-2 mb-4">{BUDGET_HINT}</Text>
            <GradientButton title={BUDGET_SAVE_LABEL} onPress={handleSaveBudget} />
          </View>

          <BackupCard />

          <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
            <View className="flex-row items-center gap-2 mb-3">
              <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
                <Icon name="manage-accounts" size={16} color={colors.primary.DEFAULT} />
              </View>
              <Text className="text-[15px] font-bold text-ink">{MANAGED_CARD_TITLE}</Text>
            </View>
            <Text className="text-[13px] leading-[19px] text-muted">{MANAGED_CARD_TEXT(active.name)}</Text>

            <View className="gap-2.5 mt-4">
              <TouchableOpacity
                onPress={() => setRenaming(true)}
                activeOpacity={0.85}
                className="h-12 rounded-2xl flex-row items-center justify-center gap-1.5 border-[1.5px]"
                style={{ backgroundColor: colors.canvas, borderColor: colors.surface.dark }}
              >
                <Icon name="edit" size={18} color={colors.primary.DEFAULT} />
                <Text className="text-[14px] font-bold text-primary">{PROFILE_MENU_RENAME}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDeleting(true)}
                activeOpacity={0.85}
                className="h-12 rounded-2xl flex-row items-center justify-center gap-1.5"
                style={{ backgroundColor: tint(colors.expense) }}
              >
                <Icon name="delete-outline" size={18} color={colors.expense} />
                <Text className="text-[14px] font-bold" style={{ color: colors.expense }}>{PROFILE_MENU_DELETE}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenScroll>

      <ProfileFormModal
        visible={renaming}
        profile={active}
        onClose={() => setRenaming(false)}
        onSaved={() => {
          setRenaming(false);
          showToast(PROFILE_RENAMED_TOAST);
        }}
      />
      <DeleteProfileModal visible={deleting} profile={active} onClose={() => setDeleting(false)} />

      <SideBar />
    </KeyboardAvoidingView>
  );
}
