import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { formatMoney } from '@/utils/format';
import { BUDGET_WARN_AT } from '../../dashboard/cardBalance-type';
import {
  ADD_LIMIT_LABEL,
  CategoryLimitsProps,
  LIMIT_PASSED,
  LIMIT_PROGRESS,
  LIMITS_EMPTY,
  LIMITS_TITLE,
  NO_LIMIT_LABEL,
} from '../myDetailing-type';

// How much of each category's limit is spent. A category with no limit is a line to tap and set one.
export default function CategoryLimits({ rows, canEdit, onPressRow, onAdd }: CategoryLimitsProps) {
  return (
    <View className="mx-4 mb-5 bg-white rounded-3xl p-5 border border-surface shadow-sm shadow-black/5 elevation-2">
      <Text className="text-base font-bold text-ink mb-3">{LIMITS_TITLE}</Text>

      {rows.length === 0 && <Text className="text-[13px] text-muted mb-1">{LIMITS_EMPTY}</Text>}

      {rows.map((row) => {
        const use = row.limit ? row.spent / row.limit : null;
        const color = use !== null && use >= BUDGET_WARN_AT ? palette.expense : palette.income;
        return (
          <TouchableOpacity
            key={row.categoryId}
            onPress={() => onPressRow(row.categoryId)}
            disabled={!canEdit}
            activeOpacity={0.7}
            className="flex-row items-center gap-3 py-2.5"
          >
            <View className="w-10 h-10 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${row.color}1F` }}>
              <Icon name={row.icon} size={20} color={row.color} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-semibold text-ink">{row.name}</Text>
                {use !== null && (
                  <Text className="text-xs font-bold" style={{ color }}>{Math.round(use * 100)}%</Text>
                )}
              </View>
              {row.limit !== null && use !== null ? (
                <>
                  <View className="h-1.5 rounded-full overflow-hidden mt-1.5" style={{ backgroundColor: palette.surface.DEFAULT }}>
                    <View className="h-full rounded-full" style={{ width: `${Math.min(100, use * 100)}%`, backgroundColor: color }} />
                  </View>
                  <Text className="text-xs text-muted mt-1">
                    {LIMIT_PROGRESS(formatMoney(row.spent), formatMoney(row.limit))}
                    {use > 1 ? ` · ${LIMIT_PASSED(formatMoney(row.spent - row.limit))}` : ''}
                  </Text>
                </>
              ) : (
                <Text className="text-xs text-muted mt-0.5">
                  {formatMoney(row.spent)}{canEdit ? ` · ${NO_LIMIT_LABEL}` : ''}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}

      {canEdit && (
        <TouchableOpacity onPress={onAdd} activeOpacity={0.7} className="flex-row items-center gap-1.5 mt-2">
          <Icon name="add" size={18} color={palette.primary.DEFAULT} />
          <Text className="text-[13px] font-bold text-primary">{ADD_LIMIT_LABEL}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
