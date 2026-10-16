import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { CardHorizontalProps, PLANNED_LABEL } from '@/types/components/cardHorizontal-type';
import RecurrenceBadge from '@/app/components/ui/RecurrenceBadge';
import { tint } from '@/utils/color';

const CardHorizontal: React.FC<CardHorizontalProps> = ({
  name = 'Transação',
  date = '10 jan 2022',
  amount = 0,
  category = 'Outros',
  icon = 'receipt',
  type = 'expense',
  iconColor: categoryColor,
  badge,
  tag,
  planned = false,
  transfer = false,
  onPress,
}) => {
  const colors = useColors();
  const isIncome = type === 'income';
  const iconColor = categoryColor ?? (isIncome ? colors.income : colors.primary.DEFAULT);
  const iconBg = categoryColor ? `${categoryColor}1F` : isIncome ? tint(colors.income) : tint(colors.primary.DEFAULT);
  const amountColor = planned || transfer ? colors.muted : isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? '+' : '-';

  const formatCurrency = (v: number) =>
    Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={planned ? undefined : onPress}
      disabled={planned}
      className="flex-row items-center bg-card rounded-2xl p-3.5 mb-2.5 border border-surface shadow-sm shadow-black/5 elevation-2"
      style={planned ? { borderStyle: 'dashed', borderColor: colors.subtle } : undefined}
    >
      {/* Ícone */}
      <View
        className="w-[46px] h-[46px] rounded-[14px] items-center justify-center mr-3"
        style={planned ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: iconColor } : { backgroundColor: iconBg }}
      >
        <Icon name={icon} size={22} color={iconColor} />
      </View>

      {/* Info */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2 mb-1">
          <Text numberOfLines={1} className="shrink text-sm font-bold text-ink">{name}</Text>
          {badge && <RecurrenceBadge label={badge} />}
          {tag && (
            <View className="rounded-[7px] bg-surface px-[7px] py-[2px]">
              <Text className="text-[11px] font-medium leading-[14px] text-muted">{tag}</Text>
            </View>
          )}
        </View>
        <Text className="text-xs text-subtle font-normal">
          {date}
        </Text>
      </View>

      {/* Valor */}
      <View className="items-end">
        <Text className="text-[15px] font-extrabold" style={{ color: amountColor }}>
          {amountPrefix} R$ {formatCurrency(amount)}
        </Text>
        <Text className="text-[10px] text-subtle mt-0.5">
          {planned ? PLANNED_LABEL : category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default CardHorizontal;
