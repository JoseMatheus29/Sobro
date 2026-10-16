import React from 'react';
import { Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import {
  PAYMENT_SPLIT_CREDIT_HINT,
  PAYMENT_SPLIT_LABELS,
  PAYMENT_SPLIT_TITLE,
  paymentColors,
  type PaymentSplitCardProps,
} from '@/types/myDetailing/myDetailing-type';
import { formatMoney } from '@/utils/format';

// The month's spending, split by how it was paid. It adds up to the same figure as "Gastos do Mês".
export default function PaymentSplitCard({ split }: PaymentSplitCardProps) {
  const colors = useColors();
  const palette = paymentColors(colors);
  const hasCredit = split.slices.some((slice) => slice.kind === 'credit');

  return (
    <View className="mx-4 mb-5 bg-card rounded-3xl p-5 border border-surface">
      <Text className="text-sm font-bold text-ink">{PAYMENT_SPLIT_TITLE}</Text>

      <View accessibilityRole="image" className="flex-row h-2.5 mt-3.5 gap-[3px]">
        {split.slices.map((slice) => (
          <View
            key={slice.kind}
            className="rounded-[3px]"
            style={{ flex: slice.amount, backgroundColor: palette[slice.kind] }}
          />
        ))}
      </View>

      <View className="mt-2">
        {split.slices.map((slice, i) => (
          <View
            key={slice.kind}
            className={`flex-row items-center gap-3 py-2.5 ${i > 0 ? 'border-t border-line' : ''}`}
          >
            <View className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: palette[slice.kind] }} />
            <Text className="flex-1 text-[13px] font-semibold text-ink">{PAYMENT_SPLIT_LABELS[slice.kind]}</Text>
            <Text className="text-[13px] font-bold text-ink">{formatMoney(slice.amount)}</Text>
            <Text className="w-10 text-right text-xs text-muted">{slice.percent}%</Text>
          </View>
        ))}
      </View>

      {hasCredit && <Text className="text-xs leading-[17px] text-muted mt-1">{PAYMENT_SPLIT_CREDIT_HINT}</Text>}
    </View>
  );
}
