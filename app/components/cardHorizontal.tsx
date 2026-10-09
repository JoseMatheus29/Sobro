import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { CardHorizontalProps, PLANNED_LABEL } from './cardHorizontal-type';
import RecurrenceBadge from './ui/RecurrenceBadge';

const CardHorizontal: React.FC<CardHorizontalProps> = ({
  name = 'Transação',
  date = '10 jan 2022',
  amount = 0,
  category = 'Outros',
  icon = 'receipt',
  type = 'expense',
  iconColor: categoryColor,
  badge,
  planned = false,
  transfer = false,
  onPress,
}) => {
  const isIncome = type === 'income';
  const iconColor = categoryColor ?? (isIncome ? palette.income : palette.primary.DEFAULT);
  const iconBg = categoryColor ? `${categoryColor}1F` : isIncome ? 'rgba(39,127,43,0.1)' : 'rgba(49,97,178,0.1)';
  const amountColor = planned || transfer ? palette.muted : isIncome ? palette.income : palette.expense;
  const amountPrefix = isIncome ? '+' : '-';

  const formatCurrency = (v: number) =>
    Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={planned ? undefined : onPress}
      disabled={planned}
      className="flex-row items-center bg-white rounded-2xl p-3.5 mb-2.5 border border-[#EBF1F6] shadow-sm shadow-black/5 elevation-2"
      style={planned ? { borderStyle: 'dashed', borderColor: palette.subtle } : undefined}
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
