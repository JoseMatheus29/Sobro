import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { withoutTransfers } from '@/utils/transfer';
import { EDIT_ACCOUNT_ACTION, TRANSFER_ACTION, WalletSummaryProps } from '@/types/wallet/wallet-type';
import { tint } from '@/utils/color';

export default function WalletSummary({ activeCard, transactions, onEditCard, onTransfer }: WalletSummaryProps) {
  const colors = useColors();
  // Receitas and despesas leave out what only moved between accounts; the saldo is the account's own.
  const real = withoutTransfers(transactions);
  const income = real.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = real.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;

  return (
    <View className="mx-4 bg-card rounded-[20px] p-5 mb-7 border border-surface">
      <View className="flex-row justify-around">
        {[
          { label: 'Receitas', value: formatCurrency(income), icon: 'arrow-downward', color: colors.income, valueColor: colors.income, bg: tint(colors.income) },
          { label: 'Despesas', value: formatCurrency(expense), icon: 'arrow-upward', color: colors.expense, valueColor: colors.expense, bg: tint(colors.expense) },
          { label: 'Saldo', value: formatCurrency(activeCard.balance), icon: 'account-balance', color: colors.primary.DEFAULT, valueColor: colors.ink, bg: tint(colors.primary.DEFAULT) },
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

      <View className="flex-row items-center justify-center gap-6 mt-5 pt-4 border-t border-surface">
        <TouchableOpacity onPress={onEditCard} className="flex-row items-center gap-1.5">
          <Icon name="edit" size={14} color={colors.primary.DEFAULT} />
          <Text className="text-[12px] font-semibold text-primary">{EDIT_ACCOUNT_ACTION}</Text>
        </TouchableOpacity>
        {onTransfer && (
          <TouchableOpacity onPress={onTransfer} className="flex-row items-center gap-1.5">
            <Icon name="swap-horiz" size={16} color={colors.primary.DEFAULT} />
            <Text className="text-[12px] font-semibold text-primary">{TRANSFER_ACTION}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
