import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '@/app/components/sidebar';
import { SCROLL_PADDING_WITH_SIDEBAR } from '@/types/components/sidebar-type';
import GradientButton from '@/app/components/ui/GradientButton';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import ProfileHeader from '@/app/editAcount/components/ProfileHeader';
import BasicInfoForm from '@/app/editAcount/components/BasicInfoForm';
import PreferencesForm from '@/app/editAcount/components/PreferencesForm';
import BackupCard from '@/app/editAcount/components/BackupCard';
import AccountCard from '@/app/editAcount/components/AccountCard';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import { PROFILE_SAVED_TOAST, REMINDERS_DENIED_TOAST } from '@/types/editAcount/editAcount-type';
import { useBudgetEntries, useProfile } from '@/db/hooks';
import { setBudgetFrom } from '@/db/budgets';
import { ensureReminderPermission, refreshReminders } from '@/db/reminders';
import { updateProfile } from '@/db/profile';
import { DEFAULT_THEME, type ThemePreference } from '@/utils/theme-type';
import { applyTheme } from '@/utils/applyTheme';
import { budgetForMonth } from '@/utils/budget';
import { monthKey } from '@/utils/month';
import { useColors } from '@/hooks/useColors';

export default function EditAcount() {
  const colors = useColors();
  const db = useSQLiteContext();
  const { showToast } = useFeedback();
  const { profile, loading, refetch } = useProfile();
  const { entries: budgetEntries, refetch: refetchBudgets } = useBudgetEntries();
  // The budget is kept per month: this form edits the one that applies from the current month on.
  const currentBudget = budgetForMonth(budgetEntries, monthKey(new Date()));

  const [nome, setNome] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [theme, setTheme] = useState<ThemePreference>(DEFAULT_THEME);

  useEffect(() => {
    if (!profile) return;
    setNome(profile.name);
    setCurrency(profile.currency);
    setRemindersEnabled(profile.remindersEnabled);
    setTheme(profile.theme);
  }, [profile]);

  useEffect(() => {
    setMonthlyBudget(currentBudget !== null ? String(currentBudget) : '');
  }, [currentBudget]);

  // Turning the reminders on asks for the permission to notify; without it they stay off.
  const handleToggleReminders = async (next: boolean) => {
    if (next && !(await ensureReminderPermission())) {
      setRemindersEnabled(false);
      showToast(REMINDERS_DENIED_TOAST);
      return;
    }
    setRemindersEnabled(next);
  };

  // Light/dark takes effect and is saved on the spot: it is a look, not something to confirm.
  const handleChangeTheme = async (next: ThemePreference) => {
    setTheme(next);
    applyTheme(next);
    await updateProfile(db, { theme: next });
  };

  const handleSalvar = async () => {
    await updateProfile(db, {
      name: nome.trim(),
      currency,
      remindersEnabled,
    });
    const typed = monthlyBudget ? Number(monthlyBudget.replace(',', '.')) : null;
    const nextBudget = typed !== null && Number.isFinite(typed) && typed > 0 ? typed : null;
    // Only a real change starts a new budget; saving the name again must not.
    if (nextBudget !== currentBudget) await setBudgetFrom(db, monthKey(new Date()), nextBudget);
    await Promise.all([refetch(), refetchBudgets()]);
    await refreshReminders(db);
    showToast(PROFILE_SAVED_TOAST);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll bottomPadding={SCROLL_PADDING_WITH_SIDEBAR} keyboardShouldPersistTaps="handled">
        <ProfileHeader name={nome} />

        <View className="px-5 -mt-7">
          <BasicInfoForm nome={nome} setNome={setNome} />

          <PreferencesForm
            currency={currency} setCurrency={setCurrency}
            monthlyBudget={monthlyBudget} setMonthlyBudget={setMonthlyBudget}
            remindersEnabled={remindersEnabled} setRemindersEnabled={handleToggleReminders}
            theme={theme} setTheme={handleChangeTheme}
          />

          <BackupCard />

          <AccountCard />

          <GradientButton title="Salvar Alterações" onPress={handleSalvar} />
        </View>
      </ScreenScroll>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
