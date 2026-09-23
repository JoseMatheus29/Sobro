import React from 'react';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';

interface MonthlyProgressProps {
  totalGastos: number;
  progress: number;
  percentage: number;
  hasBudget: boolean;
}

export default function MonthlyProgress({ totalGastos, progress, percentage, hasBudget }: MonthlyProgressProps) {
  return (
    <LinearGradient
      colors={['#3161B2', '#4A74BB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="mx-4 rounded-[20px] p-5 mb-5"
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
  );
}
