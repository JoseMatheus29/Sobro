import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CURRENCIES = ['BRL', 'USD', 'EUR'];

interface PreferencesFormProps {
  currency: string;
  setCurrency: (v: string) => void;
  monthlyBudget: string;
  setMonthlyBudget: (v: string) => void;
}

export default function PreferencesForm({
  currency, setCurrency, monthlyBudget, setMonthlyBudget
}: PreferencesFormProps) {
  return (
    <View className="bg-white rounded-[24px] p-5 mb-4 shadow-lg shadow-[#3161B2]/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-xl bg-[#3161B2]/10 items-center justify-center">
          <Icon name="tune" size={16} color="#3161B2" />
        </View>
        <Text className="text-[15px] font-bold text-[#1A2B4A]">Preferências</Text>
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
              <Text className={`text-sm ${active ? 'font-bold text-[#3161B2]' : 'font-medium text-[#718096]'}`}>
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
        <Icon name="account-balance-wallet" size={18} color="#A0AEC0" />
        <TextInput
          className="flex-1 ml-2.5 text-[15px] text-[#1A2B4A]"
          placeholder="0,00"
          placeholderTextColor="#C0CCDA"
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
          keyboardType="numeric"
        />
      </View>
    </View>
  );
}
