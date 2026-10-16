import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { formatDayMonth } from '@/utils/format';
import { recurrenceBadge } from '@/utils/recurrence';
import { isMoneyMove } from '@/utils/transfer';
import EmptyState from '@/app/components/ui/EmptyState';
import { PLANNED_LABEL } from '@/types/components/cardHorizontal-type';
import RecurrenceBadge from '@/app/components/ui/RecurrenceBadge';
import {
  EMPTY_RECENT_MESSAGE,
  RECENT_ACTION_LABEL,
  RecentTransactionsProps,
} from '@/types/dashboard/dashboard-type';

// One block with thin dividers instead of a card per transaction: the category is told by the
// icon and a short line under the name, not repeated on the right.
export default function RecentTransactions({ title, transactions, onSeeAll, onPressItem }: RecentTransactionsProps) {
  const colors = useColors();
  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-[17px] font-bold text-ink">{title}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-[13px] text-primary font-semibold">{RECENT_ACTION_LABEL}</Text>
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <EmptyState icon="receipt-long" message={EMPTY_RECENT_MESSAGE} />
      ) : (
        <View className="bg-card rounded-[20px] border border-surface px-4 shadow-sm shadow-black/5 elevation-2">
          {transactions.map((t, i) => {
            const isIncome = t.type === 'income';
            const planned = t.planned === true;
            const transfer = isMoneyMove(t);
            return (
              <TouchableOpacity
                key={t.id}
                onPress={planned ? undefined : () => onPressItem(t.id)}
                disabled={planned}
                activeOpacity={0.7}
                className={`flex-row items-center gap-3 py-3.5 ${i < transactions.length - 1 ? 'border-b border-line' : ''}`}
              >
                <View
                  className="w-10 h-10 rounded-[14px] items-center justify-center"
                  style={
                    planned
                      ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.categoryColor }
                      : { backgroundColor: `${t.categoryColor}1F` }
                  }
                >
                  <Icon name={t.categoryIcon} size={20} color={t.categoryColor} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text numberOfLines={1} className="shrink text-[15px] font-semibold text-ink">{t.name}</Text>
                    {t.recurrence && <RecurrenceBadge label={recurrenceBadge(t.recurrence)} />}
                  </View>
                  <Text numberOfLines={1} className="text-xs text-muted mt-0.5">
                    {t.categoryName} · {formatDayMonth(t.occurredAt)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text
                    className="text-[15px] font-extrabold"
                    style={{ color: planned || transfer ? colors.muted : isIncome ? colors.income : colors.expense }}
                  >
                    {isIncome ? '+' : '-'} R$ {Math.abs(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                  {planned && <Text className="text-[10px] font-bold tracking-[0.5px] text-subtle">{PLANNED_LABEL}</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
