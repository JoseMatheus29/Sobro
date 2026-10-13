import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import {
  EMPTY_CHART_HINT,
  EMPTY_CHART_TITLE,
  emptyPieData,
  ExpenseChartProps,
} from '@/types/myDetailing/myDetailing-type';
import { useColors } from '@/hooks/useColors';

export default function ExpenseChart({ pieData, totalGastos }: ExpenseChartProps) {
  const colors = useColors();
  const isEmpty = pieData.length === 0;

  return (
    <View className="bg-card mx-4 rounded-3xl p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <Text className="text-sm font-bold text-ink mb-4">
        Distribuição de Gastos
      </Text>

      <View className="flex-row items-center gap-5">
        {/* Chart */}
        <View className="items-center justify-center">
          <PieChart
            data={isEmpty ? emptyPieData(colors) : pieData}
            backgroundColor={colors.card}
            innerCircleColor={colors.card}
            radius={80}
            innerRadius={50}
            centerLabelComponent={() => (
              <View className="items-center">
                <Text className="text-[11px] text-subtle font-medium">Total</Text>
                <Text className="text-[15px] text-ink font-extrabold">
                  R${totalGastos.toLocaleString('pt-BR')}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Legenda */}
        <View className="flex-1 gap-2.5">
          {isEmpty ? (
            <View>
              <Text className="text-xs font-semibold text-ink mb-1">{EMPTY_CHART_TITLE}</Text>
              <Text className="text-[11px] text-subtle leading-4">{EMPTY_CHART_HINT}</Text>
            </View>
          ) : (
            pieData.map((item, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-ink">{item.label}</Text>
                  <Text className="text-[10px] text-subtle">{item.value}%</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}
