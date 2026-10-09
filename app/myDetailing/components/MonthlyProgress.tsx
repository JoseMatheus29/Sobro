import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';

import { palette } from '@/constants/palette';
import { MonthlyProgressProps } from '../myDetailing-type';

export default function MonthlyProgress({ totalGastos, progress, percentage, hasBudget }: MonthlyProgressProps) {
  return (
    // LinearGradient ignores borderRadius on Android; the wrapper does the clipping.
    <View className="mx-4 mb-5 rounded-3xl overflow-hidden">
      <LinearGradient
        colors={[palette.primary.DEFAULT, palette.primary.light]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="p-5"
      >
        <Text className="text-white/75 text-xs font-medium mb-1">
          Gastos do Mês
        </Text>
        <Text className="text-white text-[28px] font-extrabold mb-4">
          R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
        <Progress.Bar
          progress={progress}
          width={null}
          color="rgba(255,255,255,0.9)"
          unfilledColor="rgba(255,255,255,0.25)"
          borderWidth={0}
          borderRadius={4}
          height={6}
        />
        <Text className="text-white/65 text-[11px] mt-1.5">
          {hasBudget ? `${percentage}% do orçamento utilizado` : 'Defina um orçamento mensal no seu perfil'}
        </Text>
      </LinearGradient>
    </View>
  );
}
