import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { formatDayMonth, formatMoney } from '@/utils/format';
import { monthKeyWithYear } from '@/utils/month';
import { lastMonthOf, nextOccurrence, recurrenceBadge } from '@/utils/recurrence';
import { type RecurrenceRecord } from '@/utils/recurrence-type';
import RecurrenceBadge from '../../components/ui/RecurrenceBadge';
import {
  END_HINT,
  END_LABEL,
  RECURRENCE_ENDED,
  RECURRENCE_FINISHED,
  RECURRENCE_LAST,
  RECURRENCE_NEXT,
  RECURRENCE_NO_END,
  RECURRENCE_PER_MONTH,
  RECURRENCE_REMAINING,
  RECURRENCE_TITLE,
} from '../detailsSpend-type';

interface RecurrenceCardProps {
  recurrence: RecurrenceRecord;
  /** This transaction's payment number, when it is part of an installment plan. */
  installment: number | null;
  onEnd: () => void;
}

// Where this transaction stands in its recurring expense, and the way to end it.
export default function RecurrenceCard({ recurrence, installment, onEnd }: RecurrenceCardProps) {
  const next = nextOccurrence(recurrence);
  const last = lastMonthOf(recurrence);
  const remaining = recurrence.total !== null && next ? recurrence.total - next.installment + 1 : 0;
  const progress = recurrence.total !== null && installment !== null ? installment / recurrence.total : null;
  const endedByHand = recurrence.endMonth !== null;

  return (
    <View className="bg-white rounded-[20px] border border-surface p-4 mb-3 shadow-sm shadow-black/5 elevation-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="text-[13px] font-bold text-muted">{RECURRENCE_TITLE}</Text>
          <RecurrenceBadge label={recurrenceBadge({ installment, total: recurrence.total })} />
        </View>
        <Text className="text-xs text-muted">{RECURRENCE_PER_MONTH(formatMoney(recurrence.amount))}</Text>
      </View>

      {progress !== null && (
        <View className="h-2 rounded-full overflow-hidden mt-3.5" style={{ backgroundColor: palette.surface.DEFAULT }}>
          <View className="h-full rounded-full" style={{ width: `${Math.min(100, progress * 100)}%`, backgroundColor: palette.primary.DEFAULT }} />
        </View>
      )}

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-xs text-muted">
          {recurrence.total !== null && next
            ? RECURRENCE_REMAINING(remaining, formatMoney(remaining * recurrence.amount))
            : ''}
        </Text>
        <Text className="text-xs text-muted">
          {last ? RECURRENCE_LAST(monthKeyWithYear(last)) : RECURRENCE_NO_END}
        </Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-ink mt-3">
        {next ? RECURRENCE_NEXT(formatDayMonth(next.date)) : endedByHand ? RECURRENCE_ENDED : RECURRENCE_FINISHED}
      </Text>

      {next && (
        <>
          <TouchableOpacity
            onPress={onEnd}
            activeOpacity={0.8}
            className="h-12 mt-3.5 rounded-2xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: 'rgba(168,54,54,0.1)' }}
          >
            <Icon name="event-busy" size={18} color={palette.expense} />
            <Text className="text-[15px] font-bold text-expense">{END_LABEL}</Text>
          </TouchableOpacity>
          <Text className="text-xs text-subtle text-center mt-2">{END_HINT}</Text>
        </>
      )}
    </View>
  );
}
