import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  View,
} from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '../components/sidebar';
import { SCROLL_PADDING_WITH_SIDEBAR } from '../components/sidebar-type';
import GradientButton from '../components/ui/GradientButton';
import ScreenScroll from '../components/ui/ScreenScroll';
import ProfileHeader from './components/ProfileHeader';
import BasicInfoForm from './components/BasicInfoForm';
import PreferencesForm from './components/PreferencesForm';
import BackupCard from './components/BackupCard';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import { PROFILE_SAVED_TOAST, REMINDERS_DENIED_TOAST } from './editAcount-type';
import { useBudgetEntries, useProfile } from '@/db/hooks';
import { setBudgetFrom } from '@/db/budgets';
import { ensureReminderPermission, refreshReminders } from '@/db/reminders';
import { updateProfile } from '@/db/profile';
import { budgetForMonth } from '@/utils/budget';
import { monthKey } from '@/utils/month';

export default function EditAcount() {
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

  useEffect(() => {
    if (!profile) return;
    setNome(profile.name);
    setCurrency(profile.currency);
    setRemindersEnabled(profile.remindersEnabled);
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
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F9FC]"
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
          />

          <BackupCard />

          <GradientButton title="Salvar Alterações" onPress={handleSalvar} />
        </View>
      </ScreenScroll>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
