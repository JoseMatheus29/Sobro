import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import {
  PAYMENT_SPLIT_CREDIT_HINT,
  PAYMENT_SPLIT_LABELS,
  PAYMENT_SPLIT_TITLE,
  paymentColors,
  type PaymentSplitCardProps,
} from '@/types/myDetailing/myDetailing-type';
import { formatMoney } from '@/utils/format';

// The month's spending, split by how it was paid: a line with a small bar, which opens into the figures. It adds up
// to the same figure as "Gastos do Mês".
export default function PaymentSplitCard({ split }: PaymentSplitCardProps) {
  const colors = useColors();
  const palette = paymentColors(colors);
  const hasCredit = split.slices.some((slice) => slice.kind === 'credit');
  const [open, setOpen] = useState(false);

  return (
    <View className="mx-4 mb-4 bg-card rounded-3xl border border-surface overflow-hidden">
      <TouchableOpacity
        onPress={() => setOpen((value) => !value)}
        activeOpacity={0.8}
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3.5 px-[18px] min-h-[56px]"
      >
        <Text className="flex-1 text-[14.5px] font-bold text-ink">{PAYMENT_SPLIT_TITLE}</Text>
        <View accessibilityRole="image" className="flex-row h-2 w-24 gap-[2px]">
          {split.slices.map((slice) => (
            <View
              key={slice.kind}
              className="rounded-[3px]"
              style={{ flex: slice.amount, backgroundColor: palette[slice.kind] }}
            />
          ))}
        </View>
        <Icon name={open ? 'expand-less' : 'expand-more'} size={20} color={colors.subtle} />
      </TouchableOpacity>

      {open && (
        <View className="px-[18px] pb-4">
          {split.slices.map((slice, i) => (
            <View
              key={slice.kind}
              className="flex-row items-center gap-3 py-2.5"
              style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}
            >
              <View className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: palette[slice.kind] }} />
              <Text className="flex-1 text-[13px] font-semibold text-ink">{PAYMENT_SPLIT_LABELS[slice.kind]}</Text>
              <Text className="text-[13px] font-bold text-ink">{formatMoney(slice.amount)}</Text>
              <Text className="w-10 text-right text-xs text-muted">{slice.percent}%</Text>
            </View>
          ))}
          {hasCredit && <Text className="text-xs leading-[17px] text-muted mt-1">{PAYMENT_SPLIT_CREDIT_HINT}</Text>}
        </View>
      )}
    </View>
  );
}
