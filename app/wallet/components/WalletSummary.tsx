import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { palette } from '@/constants/palette';
import { WalletSummaryProps } from '../wallet-type';

export default function WalletSummary({ activeCard, transactions, onEditCard }: WalletSummaryProps) {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return (
    <View className="mx-4 bg-white rounded-[20px] p-5 mb-7 border border-surface">
      <View className="flex-row justify-around">
        {[
          { label: 'Receitas', value: formatCurrency(income), icon: 'arrow-downward', color: palette.income, valueColor: palette.income, bg: 'rgba(39,127,43,0.1)' },
          { label: 'Despesas', value: formatCurrency(expense), icon: 'arrow-upward', color: palette.expense, valueColor: palette.expense, bg: 'rgba(168,54,54,0.1)' },
          { label: 'Saldo', value: formatCurrency(activeCard.balance), icon: 'account-balance', color: palette.primary.DEFAULT, valueColor: palette.ink, bg: 'rgba(49,97,178,0.1)' },
        ].map((stat, i) => (
          <View key={i} className="items-center">
            <View className="w-9 h-9 rounded-xl items-center justify-center mb-2" style={{ backgroundColor: stat.bg }}>
              <Icon name={stat.icon} size={16} color={stat.color} />
            </View>
            <Text className="text-[13px] font-bold" style={{ color: stat.valueColor }}>{stat.value}</Text>
            <Text className="text-[10px] text-subtle mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={onEditCard} className="flex-row items-center justify-center gap-1.5 mt-5 pt-4 border-t border-surface">
        <Icon name="edit" size={14} color="#3161B2" />
        <Text className="text-[12px] font-semibold text-[#3161B2]">Editar conta</Text>
      </TouchableOpacity>
    </View>
  );
}
