import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import CardHorizontal from '@/app/components/cardHorizontal';
import EmptyState from '@/app/components/ui/EmptyState';

export interface Transaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  category: string;
  categoryIcon: string;
  categoryColor?: string;
  type: 'income' | 'expense';
  /** "4/10" or "Todo mês", when it comes from a recurring expense. */
  badge?: string;
  /** Planned for a month that has not started. */
  planned?: boolean;
  /** A transfer between accounts. */
  transfer?: boolean;
}

interface TransactionListProps {
  title?: string;
  actionLabel?: string;
  transactions: Transaction[];
  /** When set, shown as a placeholder row while the list is empty. */
  emptyMessage?: string;
  onActionPress?: () => void;
  onPressItem?: (id: number) => void;
}

export default function TransactionList({
  title = 'Transações',
  actionLabel = '',
  transactions,
  emptyMessage,
  onActionPress,
  onPressItem,
}: TransactionListProps) {
  return (
    <View className="px-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-ink">{title}</Text>
        <TouchableOpacity onPress={onActionPress}>
          <Text className="text-[13px] text-primary font-semibold">{actionLabel}</Text>
        </TouchableOpacity>
      </View>
      {transactions.length === 0 && emptyMessage ? (
        <EmptyState icon="receipt-long" message={emptyMessage} />
      ) : (
        transactions.map((t) => (
          <CardHorizontal
            key={t.id}
            name={t.name}
            date={t.date}
            amount={t.amount}
            category={t.category}
            icon={t.categoryIcon}
            iconColor={t.categoryColor}
            type={t.type}
            badge={t.badge}
            planned={t.planned}
            transfer={t.transfer}
            onPress={() => onPressItem?.(t.id)}
          />
        ))
      )}
    </View>
  );
}
