import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';

import { useColors } from '@/hooks/useColors';
import { formatMoney } from '@/utils/format';
import {
  BUDGET_PASSED,
  BUDGET_USED,
  MonthlyProgressProps,
  NO_BUDGET_HINT,
} from '@/types/myDetailing/myDetailing-type';

// The month's spending against its budget, with one line that says where it stands.
export default function MonthlyProgress({
  totalGastos,
  progress,
  percentage,
  hasBudget,
  budget,
  scopeName,
}: MonthlyProgressProps) {
  const colors = useColors();
  const ceiling = budget ?? 0;
  const caption = !hasBudget
    ? NO_BUDGET_HINT
    : totalGastos > ceiling
      ? BUDGET_PASSED(formatMoney(totalGastos - ceiling), formatMoney(ceiling))
      : BUDGET_USED(percentage, formatMoney(ceiling));

  return (
    // LinearGradient ignores borderRadius on Android; the wrapper does the clipping.
    <View className="mx-4 mb-4 rounded-3xl overflow-hidden">
      <LinearGradient
        colors={colors.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="p-5"
      >
        <Text className="text-white/75 text-xs font-medium mb-1">
          Gastos do Mês{scopeName ? ` · ${scopeName}` : ''}
        </Text>
        <Text className="text-white text-[28px] font-extrabold mb-4">
          R$ {totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
        {!scopeName && (
          <>
            <Progress.Bar
              progress={progress}
              width={null}
              color="rgba(255,255,255,0.9)"
              unfilledColor="rgba(255,255,255,0.25)"
              borderWidth={0}
              borderRadius={4}
              height={6}
            />
            <Text className="text-white text-xs font-bold mt-2">{caption}</Text>
          </>
        )}
      </LinearGradient>
    </View>
  );
}
