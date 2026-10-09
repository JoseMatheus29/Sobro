import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { monthTitle } from '@/utils/month';
import { useSelectedMonth } from './MonthProvider';
import { HISTORY_ROUTE, MONTH_PILL_LABEL, MONTH_PILL_STYLES } from './month-type';

// The month being shown, on the blue header. Tapping it opens the history, where another one is picked.
export default function MonthPill() {
  const router = useRouter();
  const { month, isCurrent } = useSelectedMonth();
  const look = isCurrent ? MONTH_PILL_STYLES.current : MONTH_PILL_STYLES.past;

  return (
    <TouchableOpacity
      onPress={() => router.push(HISTORY_ROUTE)}
      activeOpacity={0.8}
      accessibilityLabel={MONTH_PILL_LABEL}
      className="flex-row items-center gap-2 rounded-full h-10 pl-3.5 pr-2.5"
      style={{ backgroundColor: look.backgroundColor }}
    >
      <Icon name="calendar-month" size={18} color={look.color} />
      <Text className="text-sm font-bold" style={{ color: look.color }}>{monthTitle(month)}</Text>
      <Icon name="expand-more" size={20} color={look.color} />
    </TouchableOpacity>
  );
}
