import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { BUDGET_HINT, REMINDERS_HINT, REMINDERS_LABEL } from '../editAcount-type';

const CURRENCIES = ['BRL', 'USD', 'EUR'];

interface PreferencesFormProps {
  currency: string;
  setCurrency: (v: string) => void;
  monthlyBudget: string;
  setMonthlyBudget: (v: string) => void;
  remindersEnabled: boolean;
  setRemindersEnabled: (v: boolean) => void;
}

export default function PreferencesForm({
  currency, setCurrency, monthlyBudget, setMonthlyBudget, remindersEnabled, setRemindersEnabled
}: PreferencesFormProps) {
  return (
    <View className="bg-white rounded-[24px] p-5 mb-4 shadow-lg shadow-[#3161B2]/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-xl bg-[#3161B2]/10 items-center justify-center">
          <Icon name="tune" size={16} color="#3161B2" />
        </View>
        <Text className="text-[15px] font-bold text-ink">Preferências</Text>
      </View>

      <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">Moeda</Text>
      <View className="flex-row gap-2 mb-3.5">
        {CURRENCIES.map((c) => {
          const active = currency === c;
          return (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              className={`flex-1 h-11 rounded-xl items-center justify-center border-[1.5px] ${active ? 'bg-[#3161B2]/10 border-[#3161B2]' : 'bg-[#F7F9FC] border-transparent'}`}
            >
              <Text className={`text-sm ${active ? 'font-bold text-[#3161B2]' : 'font-medium text-muted'}`}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">
        Orçamento mensal
      </Text>
      <View className="flex-row items-center bg-[#F7F9FC] rounded-2xl border-[1.5px] border-[#E8EEF5] px-3.5 h-[52px]">
        <Icon name="account-balance-wallet" size={18} color={palette.subtle} />
        <TextInput
          className="flex-1 ml-2.5 text-[15px] text-ink"
          placeholder="0,00"
          placeholderTextColor="#C0CCDA"
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
          trackColor={{ false: palette.surface.dark, true: palette.primary.light }}
          thumbColor={remindersEnabled ? palette.primary.DEFAULT : '#FFFFFF'}
          accessibilityLabel={REMINDERS_LABEL}
        />
      </View>
    </View>
  );
}
