import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { budgetColor } from '@/utils/budget';
import { legendOf, overLimit } from '@/utils/categoryRows';
import { tint } from '@/utils/color';
import { formatMoney } from '@/utils/format';
import {
  ADD_LIMIT_LABEL,
  CATEGORY_SECTION_TITLE,
  COLLAPSE_LABEL,
  CategorySectionProps,
  EDIT_LIMIT_HINT,
  EMPTY_CHART_HINT,
  EMPTY_CHART_TITLE,
  EXPAND_CATEGORIES,
  LEGEND_MORE,
  LIMIT_ALERT_MANY,
  LIMIT_ALERT_ONE,
  LIMIT_LEFT,
  LIMIT_OVER,
  emptyPieData,
} from '@/types/myDetailing/myDetailing-type';

const DONUT_RADIUS = 48;
const DONUT_HOLE = 30;

// The month's spending by category: a small donut with the biggest named beside it, and the whole list (value, share
// and limit of each) only when asked for. A category past its limit is told even while the list is closed.
export default function CategorySection({ rows, total, showLimits, canEdit, onPressRow, onAddLimit }: CategorySectionProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const spending = rows.filter((r) => r.spent > 0);
  const legend = legendOf(rows, total);
  const over = showLimits ? overLimit(rows) : [];
  const pieData = spending.length > 0 ? spending.map((r) => ({ value: r.spent, color: r.color, label: r.name })) : emptyPieData(colors);
  const editable = showLimits && canEdit;

  const donut = (
    <PieChart
      data={pieData}
      backgroundColor={colors.card}
      innerCircleColor={colors.card}
      radius={DONUT_RADIUS}
      innerRadius={DONUT_HOLE}
    />
  );

  if (rows.length === 0) {
    return (
      <View className="mx-4 mb-4 bg-card rounded-3xl p-5 border border-surface">
        <Text className="text-[17px] font-bold text-ink">{CATEGORY_SECTION_TITLE}</Text>
        <View className="flex-row items-center gap-[18px] mt-3.5">
          {donut}
          <View className="flex-1">
            <Text className="text-[13px] font-semibold text-ink mb-1">{EMPTY_CHART_TITLE}</Text>
            <Text className="text-xs text-subtle leading-[17px]">{EMPTY_CHART_HINT}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 mb-4 bg-card rounded-3xl p-5 border border-surface">
      <Text className="text-[17px] font-bold text-ink">{CATEGORY_SECTION_TITLE}</Text>

      {expanded ? (
        <>
          <View className="items-center mt-3.5 mb-2">{donut}</View>

          {rows.map((row, i) => {
            const use = row.limit !== null && row.limit > 0 ? row.spent / row.limit : null;
            const color = budgetColor(use, colors);
            return (
              <TouchableOpacity
                key={row.categoryId}
                onPress={() => onPressRow(row.categoryId)}
                disabled={!editable}
                activeOpacity={0.7}
                accessibilityHint={editable ? EDIT_LIMIT_HINT : undefined}
                style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}
              >
                <View className="flex-row items-center gap-2.5 min-h-[46px]">
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  <Text className="flex-1 text-[14.5px] font-semibold text-ink">{row.name}</Text>
                  <Text className="text-[14.5px] font-bold text-ink">{formatMoney(row.spent)}</Text>
                </View>
                {row.limit !== null && use !== null && (
                  <View className="pl-5 pb-3">
                    <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: colors.surface.DEFAULT }}>
                      <View className="h-full rounded-full" style={{ width: `${Math.min(100, use * 100)}%`, backgroundColor: color }} />
                    </View>
                    <Text
                      className="text-xs mt-1.5"
                      style={use > 1 ? { color: colors.expense, fontWeight: '700' } : { color: colors.muted }}
                    >
                      {use > 1
                        ? LIMIT_OVER(formatMoney(row.spent - row.limit), formatMoney(row.limit))
                        : LIMIT_LEFT(formatMoney(row.limit - row.spent), formatMoney(row.limit))}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          <View className="flex-row gap-2.5 mt-2">
            <TouchableOpacity
              onPress={() => setExpanded(false)}
              activeOpacity={0.8}
              accessibilityState={{ expanded: true }}
              className="flex-1 h-[46px] rounded-[14px] bg-surface flex-row items-center justify-center gap-1.5"
            >
              <Text className="text-[13px] font-bold text-primary">{COLLAPSE_LABEL}</Text>
              <Icon name="expand-less" size={18} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
            {editable && (
              <TouchableOpacity
                onPress={onAddLimit}
                activeOpacity={0.8}
                className="flex-1 h-[46px] rounded-[14px] bg-surface flex-row items-center justify-center gap-1.5"
              >
                <Icon name="add" size={16} color={colors.primary.DEFAULT} />
                <Text className="text-[13px] font-bold text-primary">{ADD_LIMIT_LABEL}</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      ) : (
        <>
          <View className="flex-row items-center gap-[18px] mt-3.5">
            {donut}
            <View className="flex-1 gap-2.5">
              {legend.top.map((item) => (
                <View key={item.categoryId} className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <Text numberOfLines={1} className="flex-1 text-sm font-semibold text-ink">{item.name}</Text>
                  <Text className="text-sm text-muted">{item.percent}%</Text>
                </View>
              ))}
              {legend.restCount > 0 && (
                <View className="flex-row items-center gap-2">
                  <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors.subtle }} />
                  <Text className="flex-1 text-sm text-muted">{LEGEND_MORE(legend.restCount)}</Text>
                  <Text className="text-sm text-muted">{legend.restPercent}%</Text>
                </View>
              )}
            </View>
          </View>

          {over.length > 0 && (
            <TouchableOpacity
              onPress={() => setExpanded(true)}
              activeOpacity={0.8}
              className="flex-row items-center gap-2.5 mt-3.5 min-h-[44px] px-3 py-2 rounded-[14px]"
              style={{ backgroundColor: tint(colors.expense) }}
            >
              <Icon name="warning-amber" size={18} color={colors.expense} />
              <Text className="flex-1 text-[13px] text-ink">
                {over.length === 1 ? LIMIT_ALERT_ONE(over[0].name) : LIMIT_ALERT_MANY(over.length)}
              </Text>
              <Icon name="chevron-right" size={18} color={colors.subtle} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => setExpanded(true)}
            activeOpacity={0.8}
            accessibilityState={{ expanded: false }}
            className="mt-2.5 h-[46px] rounded-[14px] bg-surface flex-row items-center justify-center gap-1.5"
          >
            <Text className="text-[13px] font-bold text-primary">{EXPAND_CATEGORIES(rows.length)}</Text>
            <Icon name="expand-more" size={18} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
