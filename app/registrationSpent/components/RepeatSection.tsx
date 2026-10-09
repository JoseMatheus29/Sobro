import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { tint } from '@/utils/color';
import { formatMoney } from '@/utils/format';
import { monthKey, monthKeyWithYear } from '@/utils/month';
import { installmentSummary } from '@/utils/recurrence';
import { MAX_INSTALLMENTS, MIN_INSTALLMENTS } from '@/utils/recurrence-type';
import {
  CURRENT_INSTALLMENT_LABEL,
  INSTALLMENT_SUMMARY_TEXT,
  INSTALLMENT_SUMMARY_TITLE,
  INSTALLMENTS_LABEL,
  MONTHLY_SUMMARY_TEXT,
  MONTHLY_SUMMARY_TITLE,
  REPEAT_OPTIONS,
  REPEAT_TITLE,
  RepeatSectionProps,
  TOGGLE_THUMB_STYLE,
} from '../registrationSpent-type';

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl border-[1.5px] border-line px-2.5 py-2">
      <Text className="text-[11px] text-subtle mb-1">{label}</Text>
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          accessibilityLabel={`Menos: ${label}`}
          className="w-9 h-9 rounded-xl bg-surface items-center justify-center"
        >
          <Icon name="remove" size={20} color={palette.primary.DEFAULT} />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-ink">{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          accessibilityLabel={`Mais: ${label}`}
          className="w-9 h-9 rounded-xl bg-surface items-center justify-center"
        >
          <Icon name="add" size={20} color={palette.primary.DEFAULT} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// "Repetir": does not repeat, every month, or in installments. Only an expense gets it.
export default function RepeatSection({
  amountValue,
  date,
  repeat,
  setRepeat,
  installments,
  setInstallments,
  currentInstallment,
  setCurrentInstallment,
}: RepeatSectionProps) {
  const summary =
    repeat === 'installments'
      ? installmentSummary({ total: installments, current: currentInstallment, amount: amountValue, startMonth: monthKey(date) })
      : null;

  return (
    <View>
      <Text className="text-[13px] font-bold text-muted mt-1 ml-1 mb-2">{REPEAT_TITLE}</Text>

      <View className="flex-row bg-surface rounded-2xl p-1 gap-1">
        {REPEAT_OPTIONS.map((option) => {
          const active = option.mode === repeat;
          return (
            <TouchableOpacity
              key={option.mode}
              onPress={() => setRepeat(option.mode)}
              activeOpacity={0.8}
              accessibilityState={{ selected: active }}
              className="flex-1 h-10 rounded-xl items-center justify-center"
              style={active ? TOGGLE_THUMB_STYLE : undefined}
            >
              <Text
                className="text-sm"
                style={{ color: active ? palette.primary.DEFAULT : palette.muted, fontWeight: active ? '700' : '500' }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {repeat === 'installments' && (
        <View className="flex-row gap-2.5 mt-2.5">
          <Stepper
            label={INSTALLMENTS_LABEL}
            value={installments}
            min={MIN_INSTALLMENTS}
            max={MAX_INSTALLMENTS}
            onChange={(n) => {
              setInstallments(n);
              if (currentInstallment > n) setCurrentInstallment(n);
            }}
          />
          <Stepper
            label={CURRENT_INSTALLMENT_LABEL}
            value={currentInstallment}
            min={1}
            max={installments}
            onChange={setCurrentInstallment}
          />
        </View>
      )}

      {repeat !== 'none' && (
        <View
          className="flex-row items-center gap-3 mt-2.5 rounded-2xl p-3.5 border"
          style={{ backgroundColor: tint(palette.primary.DEFAULT), borderColor: tint(palette.primary.DEFAULT) }}
        >
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: tint(palette.primary.DEFAULT) }}>
            <Icon name="autorenew" size={20} color={palette.primary.DEFAULT} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-ink">
              {summary
                ? INSTALLMENT_SUMMARY_TITLE(summary.remaining, formatMoney(amountValue))
                : MONTHLY_SUMMARY_TITLE(date.getUTCDate())}
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              {summary
                ? INSTALLMENT_SUMMARY_TEXT(formatMoney(summary.remainingTotal), monthKeyWithYear(summary.lastMonth))
                : MONTHLY_SUMMARY_TEXT}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
