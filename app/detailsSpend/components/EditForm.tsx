import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import {
  MAX_AMOUNT_DIGITS,
  toggleThumbStyle,
  TX_TYPE_OPTIONS,
  typeColors,
} from '@/types/registrationSpent/registrationSpent-type';
import { formatCents } from '@/utils/transactionForm';
import { formatLongDate } from '@/utils/format';
import {
  AMOUNT_PLACEHOLDER,
  DESCRIPTION_PLACEHOLDER,
  EditFormProps,
  FIELD_LABELS,
  NAME_PLACEHOLDER,
  SELECT_LABEL,
} from '@/types/detailsSpend/detailsSpend-type';
import DetailRow from '@/app/detailsSpend/components/DetailRow';
import PaymentMethodToggle from '@/app/components/ui/PaymentMethodToggle';
import { PAYMENT_EDIT_HINT } from '@/types/components/ui/payment-type';
import { useColors } from '@/hooks/useColors';

const INPUT_CLASS = 'text-base font-medium text-ink mt-0.5';

export default function EditForm({
  typeColor, type, setType, amount, setAmount, name, setName, category, card, date,
  description, setDescription, onPickCategory, onPickCard, onPickDate, showPayment, payment, setPayment,
}: EditFormProps) {
  const colors = useColors();
  const cents = parseInt(amount || '0', 10) || 0;

  return (
    <View className="bg-card rounded-[24px] px-5 py-1 mb-5 shadow-lg shadow-primary/10 elevation-4">
      <DetailRow icon="payments" color={typeColor} label={FIELD_LABELS.amount}>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          keyboardType="numeric"
          placeholder={AMOUNT_PLACEHOLDER}
          placeholderTextColor={colors.placeholder}
          value={cents > 0 ? formatCents(cents) : ''}
          onChangeText={(text) => setAmount(text.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS))}
        />
      </DetailRow>

      <DetailRow icon="edit" color={colors.primary.DEFAULT} label={FIELD_LABELS.name}>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          placeholder={NAME_PLACEHOLDER}
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
        />
      </DetailRow>

      <DetailRow
        icon={type === 'income' ? 'arrow-downward' : 'arrow-upward'}
        color={typeColor}
        label={FIELD_LABELS.type}
      >
        {/* Same white-thumb toggle as the new-transaction flow; only the text takes the type color. */}
        <View className="self-start flex-row gap-1 p-1 rounded-xl bg-surface mt-1.5">
          {TX_TYPE_OPTIONS.map((option) => {
            const active = type === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                onPress={() => setType(option.type)}
                activeOpacity={0.85}
                accessibilityState={{ selected: active }}
                className="h-8 px-3.5 rounded-lg items-center justify-center"
                style={active ? toggleThumbStyle(colors) : undefined}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: active ? typeColors(colors)[option.type] : colors.muted }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DetailRow>

      <DetailRow
        icon={category?.icon ?? 'category'}
        color={category?.color ?? colors.muted}
        label={FIELD_LABELS.category}
        onPress={onPickCategory}
      >
        <Text className={INPUT_CLASS} style={category ? undefined : { color: colors.muted }}>
          {category?.name ?? SELECT_LABEL}
        </Text>
      </DetailRow>

      <DetailRow icon="account-balance-wallet" color={colors.primary.DEFAULT} label={FIELD_LABELS.card} onPress={onPickCard}>
        <Text className={INPUT_CLASS}>{card?.name ?? SELECT_LABEL}</Text>
      </DetailRow>

      <DetailRow icon="event" color={colors.primary.DEFAULT} label={FIELD_LABELS.date} onPress={onPickDate}>
        <Text className={INPUT_CLASS}>{formatLongDate(date.toISOString())}</Text>
      </DetailRow>

      {showPayment && (
        <DetailRow icon="credit-card" color={colors.primary.DEFAULT} label={FIELD_LABELS.payment}>
          <View className="mt-1.5 pb-1">
            <PaymentMethodToggle value={payment} onChange={setPayment} />
            <Text className="text-xs leading-[17px] text-muted mt-2">{PAYMENT_EDIT_HINT}</Text>
          </View>
        </DetailRow>
      )}

      <DetailRow icon="notes" color={colors.primary.DEFAULT} label={FIELD_LABELS.description} last>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          placeholder={DESCRIPTION_PLACEHOLDER}
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </DetailRow>
    </View>
  );
}
