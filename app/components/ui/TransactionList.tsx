import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CardHorizontal from '../cardHorizontal';

export interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  category: string;
  categoryIcon: string;
  type: 'income' | 'expense';
}

interface TransactionListProps {
  title?: string;
  actionLabel?: string;
  transactions: Transaction[];
  onActionPress?: () => void;
  onPressItem?: (id: number) => void;
}

export default function TransactionList({
  title = 'Transações',
  actionLabel = 'Ver todos',
  transactions,
  onActionPress,
  onPressItem,
}: TransactionListProps) {
  return (
    <View className="px-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-[#1A2B4A]">{title}</Text>
        <TouchableOpacity onPress={onActionPress}>
          <Text className="text-[13px] text-[#3161B2] font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      </View>
      {transactions.map((t) => (
        <CardHorizontal
          key={t.id}
          name={t.name}
          date={t.date}
          amount={t.amount}
          category={t.category}
          icon={t.categoryIcon}
          type={t.type}
          onPress={() => onPressItem?.(t.id)}
        />
      ))}
    </View>
  );
}
