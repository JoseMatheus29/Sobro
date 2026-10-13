import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { type ThemePreference } from '@/utils/theme-type';
import { BUDGET_HINT, REMINDERS_HINT, REMINDERS_LABEL, THEME_HINT, THEME_LABEL, THEME_OPTIONS } from '@/types/editAcount/editAcount-type';

const CURRENCIES = ['BRL', 'USD', 'EUR'];

interface PreferencesFormProps {
  currency: string;
  setCurrency: (v: string) => void;
  monthlyBudget: string;
  setMonthlyBudget: (v: string) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (v: boolean) => void;
  theme: ThemePreference;
  setTheme: (v: ThemePreference) => void;
}

export default function PreferencesForm({
  currency, setCurrency, monthlyBudget, setMonthlyBudget, remindersEnabled, setRemindersEnabled, theme, setTheme
}: PreferencesFormProps) {
  const colors = useColors();
  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="tune" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">Preferências</Text>
      </View>

      <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">Moeda</Text>
      <View className="flex-row gap-2 mb-3.5">
        {CURRENCIES.map((c) => {
          const active = currency === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              className={`flex-1 h-11 rounded-xl items-center justify-center border-[1.5px] ${active ? 'bg-primary/10 border-primary' : 'bg-canvas border-transparent'}`}
            >
              <Text className={`text-sm ${active ? 'font-bold text-primary' : 'font-medium text-muted'}`}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">{THEME_LABEL}</Text>
      <View className="flex-row gap-2">
        {THEME_OPTIONS.map((option) => {
          const active = theme === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => setTheme(option.value)}
              accessibilityState={{ selected: active }}
              className={`flex-1 h-11 rounded-xl flex-row items-center justify-center gap-1.5 border-[1.5px] ${active ? 'bg-primary/10 border-primary' : 'bg-canvas border-transparent'}`}
            >
              <Icon name={option.icon} size={16} color={active ? colors.primary.DEFAULT : colors.muted} />
              <Text className={`text-sm ${active ? 'font-bold text-primary' : 'font-medium text-muted'}`}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text className="text-xs text-muted mt-2 mb-3.5">{THEME_HINT}</Text>

      <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
        Orçamento mensal
      </Text>
      <View className="flex-row items-center bg-canvas rounded-2xl border-[1.5px] border-line px-3.5 h-[52px]">
        <Icon name="account-balance-wallet" size={18} color={colors.subtle} />
        <TextInput
          className="flex-1 ml-2.5 text-[15px] text-ink"
          placeholder="0,00"
          placeholderTextColor={colors.placeholder}
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
          keyboardType="numeric"
        />
      </View>
      <Text className="text-xs text-muted mt-2">{BUDGET_HINT}</Text>

      <View className="flex-row items-center gap-3 mt-5 pt-4 border-t border-line">
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-ink">{REMINDERS_LABEL}</Text>
          <Text className="text-xs text-muted mt-0.5">{REMINDERS_HINT}</Text>
        </View>
        <Switch
          value={remindersEnabled}
          onValueChange={setRemindersEnabled}
          trackColor={{ false: colors.surface.dark, true: colors.primary.light }}
          thumbColor={remindersEnabled ? colors.buttonGradient[0] : '#FFFFFF'}
          accessibilityLabel={REMINDERS_LABEL}
        />
      </View>
    </View>
  );
}
