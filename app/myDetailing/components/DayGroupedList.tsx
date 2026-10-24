import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import EmptyState from '@/app/components/ui/EmptyState';
import RecurrenceBadge from '@/app/components/ui/RecurrenceBadge';
import { useColors } from '@/hooks/useColors';
import { PLANNED_LABEL } from '@/types/components/cardHorizontal-type';
import { dayLabel, groupByDay } from '@/utils/dayGroups';
import { formatMoney } from '@/utils/format';
import {
  DayGroupedListProps,
  SHOW_LESS_TRANSACTIONS,
  SHOW_MORE_TRANSACTIONS,
  TRANSACTIONS_INITIAL,
  TRANSACTIONS_TITLE,
} from '@/types/myDetailing/myDetailing-type';

// The month's spending, in one card and a day at a time. Only the first few show until asked for the rest, which
// opens in place (no other screen).
export default function DayGroupedList({ transactions, emptyMessage, onPressItem }: DayGroupedListProps) {
  const colors = useColors();
  const [showAll, setShowAll] = useState(false);

  const hidden = transactions.length > TRANSACTIONS_INITIAL;
  const visible = showAll ? transactions : transactions.slice(0, TRANSACTIONS_INITIAL);
  const groups = groupByDay(visible);
  const currentYear = new Date().getFullYear();

  return (
    <View className="px-4">
      <Text className="text-[17px] font-bold text-ink mb-2.5">{TRANSACTIONS_TITLE}</Text>

      {transactions.length === 0 ? (
        <EmptyState icon="receipt-long" message={emptyMessage} />
      ) : (
        <View className="bg-card rounded-3xl border border-surface overflow-hidden pb-1">
          {groups.map((group, g) => (
            <View key={`${group.day}-${g}`} style={{ borderTopWidth: g === 0 ? 0 : 1, borderTopColor: colors.line }}>
              <Text className="px-4 pt-3.5 pb-0.5 text-[11px] font-bold tracking-[0.8px] text-primary-lighter">
                {dayLabel(group.day, currentYear)}
              </Text>
              {group.items.map((t) => {
                const isIncome = t.type === 'income';
                const amountColor = t.planned ? colors.muted : isIncome ? colors.income : colors.expense;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => onPressItem(t.id)}
                    disabled={t.planned}
                    activeOpacity={0.75}
                    className="flex-row items-center gap-3 px-4 min-h-[60px]"
                    style={t.planned ? { opacity: 0.7 } : undefined}
                  >
                    <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.categoryColor ?? colors.primary.DEFAULT }} />
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-[14.5px] font-bold text-ink">{t.name}</Text>
                      <View className="flex-row items-center gap-1.5 mt-0.5">
                        <Text numberOfLines={1} className="shrink text-xs text-muted">{t.category}</Text>
                        {t.badge && <RecurrenceBadge label={t.badge} />}
                        {t.tag && (
                          <View className="rounded-[7px] bg-surface px-[7px] py-[2px]">
                            <Text className="text-[11px] font-medium leading-[14px] text-muted">{t.tag}</Text>
                          </View>
                        )}
                        {t.planned && <Text className="text-[10px] font-bold text-muted">{PLANNED_LABEL}</Text>}
                      </View>
                    </View>
                    <Text className="text-[14.5px] font-bold" style={{ color: amountColor }}>
                      {isIncome ? '+' : '-'} {formatMoney(Math.abs(t.amount))}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {hidden && (
            <TouchableOpacity
              onPress={() => setShowAll((value) => !value)}
              activeOpacity={0.8}
              accessibilityState={{ expanded: showAll }}
              className="mx-3 mt-1.5 mb-2 h-[46px] rounded-[14px] bg-surface flex-row items-center justify-center gap-1.5"
            >
              <Text className="text-[13px] font-bold text-primary">
                {showAll ? SHOW_LESS_TRANSACTIONS : SHOW_MORE_TRANSACTIONS}
              </Text>
              <Icon name={showAll ? 'expand-less' : 'expand-more'} size={18} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
