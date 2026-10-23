import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import Stepper from '@/app/components/ui/Stepper';
import { useColors } from '@/hooks/useColors';
import { tint } from '@/utils/color';
import { formatMoney } from '@/utils/format';
import { installmentLabels } from '@/utils/installments';
import { installmentSummary } from '@/utils/recurrence';
import { MAX_INSTALLMENTS, MIN_INSTALLMENTS } from '@/utils/recurrence-type';
import {
  CURRENT_INSTALLMENT_LABEL,
  INSTALLMENT_NOT_YET_MESSAGE,
  INSTALLMENT_SCHEDULE_TEXT,
  INSTALLMENT_SKIPPED_TEXT,
  INSTALLMENT_SUMMARY_TEXT,
  INSTALLMENT_SUMMARY_TITLE,
  INSTALLMENTS_LABEL,
  MONTHLY_SUMMARY_TEXT,
  MONTHLY_SUMMARY_TITLE,
  REPEAT_OPTIONS,
  REPEAT_TITLE,
  RepeatSectionProps,
  toggleThumbStyle,
} from '@/types/registrationSpent/registrationSpent-type';

// "Repetir": does not repeat, every month, or in installments. Only an expense gets it.
export default function RepeatSection({
  amountValue,
  date,
  plan,
  repeat,
  setRepeat,
  installments,
  setInstallments,
  currentInstallment,
  setCurrentInstallment,
}: RepeatSectionProps) {
  const colors = useColors();
  // The plan starts at the installment the person is on, on its own day (not on the day of the purchase).
  const summary =
    repeat === 'installments' && plan
      ? installmentSummary({ total: installments, current: currentInstallment, amount: amountValue, startMonth: plan.firstDay.slice(0, 7) })
      : null;
  const labels = plan ? installmentLabels(plan) : null;

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
              style={active ? toggleThumbStyle(colors) : undefined}
            >
              <Text
                className="text-sm"
                style={{ color: active ? colors.primary.DEFAULT : colors.muted, fontWeight: active ? '700' : '500' }}
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
          style={{ backgroundColor: tint(colors.primary.DEFAULT), borderColor: tint(colors.primary.DEFAULT) }}
        >
          <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: tint(colors.primary.DEFAULT) }}>
            <Icon name="autorenew" size={20} color={colors.primary.DEFAULT} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-ink">
              {summary
                ? INSTALLMENT_SUMMARY_TITLE(summary.remaining, formatMoney(amountValue))
                : MONTHLY_SUMMARY_TITLE(date.getUTCDate())}
            </Text>
            <Text className="text-xs text-muted mt-0.5">
              {summary && plan && labels
                ? INSTALLMENT_SUMMARY_TEXT(
                    formatMoney(summary.remainingTotal),
                    INSTALLMENT_SCHEDULE_TEXT({
                      current: plan.current,
                      total: plan.total,
                      first: labels.first,
                      last: labels.last,
                      onCredit: plan.onCredit,
                    })
                  )
                : MONTHLY_SUMMARY_TEXT}
            </Text>
          </View>
        </View>
      )}

      {repeat === 'installments' && plan && plan.skipped > 0 && (
        <Text className="text-xs leading-[17px] text-muted mt-2 ml-1">{INSTALLMENT_SKIPPED_TEXT(plan.skipped)}</Text>
      )}
      {repeat === 'installments' && plan && labels && plan.notYet && (
        <Text className="text-xs leading-[17px] mt-2 ml-1" style={{ color: colors.expense }}>
          {INSTALLMENT_NOT_YET_MESSAGE(plan.current, labels.first, plan.onCredit)}
        </Text>
      )}
    </View>
  );
}
