import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { formatDayMonth } from '@/utils/format';
import EmptyState from '../../components/ui/EmptyState';
import {
  EMPTY_RECENT_MESSAGE,
  RECENT_ACTION_LABEL,
  RECENT_TITLE,
  RecentTransactionsProps,
} from '../dashboard-type';

// One block with thin dividers instead of a card per transaction: the category is told by the
// icon and a short line under the name, not repeated on the right.
export default function RecentTransactions({ transactions, onSeeAll, onPressItem }: RecentTransactionsProps) {
  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[17px] font-bold text-ink">{RECENT_TITLE}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-[13px] text-primary font-semibold">{RECENT_ACTION_LABEL}</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <EmptyState icon="receipt-long" message={EMPTY_RECENT_MESSAGE} />
      ) : (
        <View className="bg-white rounded-[20px] border border-surface px-4 shadow-sm shadow-black/5 elevation-2">
          {transactions.map((t, i) => {
            const isIncome = t.type === 'income';
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => onPressItem(t.id)}
                activeOpacity={0.7}
                className={`flex-row items-center gap-3 py-3.5 ${i < transactions.length - 1 ? 'border-b border-line' : ''}`}
              >
                <View
                  className="w-10 h-10 rounded-[14px] items-center justify-center"
                  style={{ backgroundColor: `${t.categoryColor}1F` }}
                >
                  <Icon name={t.categoryIcon} size={20} color={t.categoryColor} />
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="text-[15px] font-semibold text-ink">{t.name}</Text>
                  <Text numberOfLines={1} className="text-xs text-muted mt-0.5">
                    {t.categoryName} · {formatDayMonth(t.occurredAt)}
                  </Text>
                </View>
                <Text className="text-[15px] font-extrabold" style={{ color: isIncome ? palette.income : palette.expense }}>
                  {isIncome ? '+' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
