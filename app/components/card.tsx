import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { CardValues } from './card-type';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

export const Card: React.FC<CardValues> = ({
  cardName,
  cardNumber,
  expensesAmount,
  backgroundColor,
  lightColor,
  style,
  isSelected,
}) => {
  const baseColor = backgroundColor ?? '#3161B2';
  const lighterColor = lightColor ?? '#4A74BB';

  return (
    <View
      className={`rounded-3xl overflow-hidden shadow-2xl elevation-10 ${isSelected ? 'scale-105' : ''}`}
      style={[{ shadowColor: baseColor }, style]}
    >
      <LinearGradient
        colors={[lighterColor, baseColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[180px] p-[22px]"
      >
        {/* Círculos decorativos */}
        <View className="absolute -top-[30px] -right-[30px] w-[120px] h-[120px] rounded-full bg-white/10" />
        <View className="absolute -bottom-[20px] right-[40px] w-[80px] h-[80px] rounded-full bg-white/5" />

        {/* Topo do card */}
        <View className="flex-row justify-between items-center mb-auto">
          <Text className="text-white text-base font-bold tracking-wide">
            {cardName}
          </Text>
          <Icon name="credit-card" size={22} color="rgba(255,255,255,0.7)" />
        </View>

        {/* Número */}
        <Text className="text-white/60 text-[15px] tracking-[3px] font-medium mt-7">
          •••• •••• {cardNumber.replace(/\*/g, '')}
        </Text>

        {/* Rodapé */}
        <View className="flex-row justify-between items-end mt-3">
          <View>
            <Text className="text-white/60 text-[10px] font-medium mb-0.5 uppercase tracking-wide">
              Despesas
            </Text>
            <Text className="text-white text-xl font-extrabold">
              R$ {formatCurrency(expensesAmount)}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

export default Card;
