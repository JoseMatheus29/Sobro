import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { CardCategory } from './categoryCard-type';

export const CategoryCard: React.FC<CardCategory> = ({ value, total, name, icon, color, bg }) => {
  const pct = Math.min((value / total) * 100, 100);

  const formatCurrency = (v: number) =>
    v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-1 bg-white rounded-[20px] p-4 border border-[#EBF1F6] shadow-md shadow-[#3161B2]/5 elevation-3"
    >
      {/* Ícone */}
      <View
        className="w-11 h-11 rounded-[14px] items-center justify-center mb-3"
        style={{ backgroundColor: bg }}
      >
        <Icon name={icon} size={22} color={color} />
      </View>

      {/* Label */}
      <Text className="text-xs text-[#718096] font-medium mb-1">
        {name}
      </Text>

      {/* Valor */}
      <Text className="text-lg font-extrabold text-[#1A2B4A] mb-2.5">
        R$ {formatCurrency(value)}
      </Text>

      {/* Barra de progresso */}
      <View className="h-1 bg-[#EBF1F6] rounded-sm overflow-hidden">
        <View
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
      <Text className="text-[10px] text-[#A0AEC0] mt-1">
        {pct.toFixed(0)}% do orçamento
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryCard;
