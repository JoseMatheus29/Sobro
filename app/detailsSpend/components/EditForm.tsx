import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { palette } from '@/constants/palette';
import {
  MAX_AMOUNT_DIGITS,
  TOGGLE_THUMB_STYLE,
  TX_TYPE_OPTIONS,
  TYPE_COLORS,
} from '../../registrationSpent/registrationSpent-type';
import { formatCents } from '../../registrationSpent/utils';
import { formatLongDate } from '@/utils/format';
import {
  AMOUNT_PLACEHOLDER,
  DESCRIPTION_PLACEHOLDER,
  EditFormProps,
  FIELD_LABELS,
  NAME_PLACEHOLDER,
  SELECT_LABEL,
} from '../detailsSpend-type';
import DetailRow from './DetailRow';

const INPUT_CLASS = 'text-base font-medium text-ink mt-0.5';
const PLACEHOLDER_COLOR = palette.subtle;

export default function EditForm({
  typeColor, type, setType, amount, setAmount, name, setName, category, card, date,
  description, setDescription, onPickCategory, onPickCard, onPickDate,
}: EditFormProps) {
  const cents = parseInt(amount || '0', 10) || 0;

  return (
    <View className="bg-white rounded-[24px] px-5 py-1 mb-5 shadow-lg shadow-primary/10 elevation-4">
      <DetailRow icon="payments" color={typeColor} label={FIELD_LABELS.amount}>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          keyboardType="numeric"
          placeholder={AMOUNT_PLACEHOLDER}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={cents > 0 ? formatCents(cents) : ''}
          onChangeText={(text) => setAmount(text.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS))}
        />
      </DetailRow>

      <DetailRow icon="edit" color={palette.primary.DEFAULT} label={FIELD_LABELS.name}>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          placeholder={NAME_PLACEHOLDER}
          placeholderTextColor={PLACEHOLDER_COLOR}
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
                style={active ? TOGGLE_THUMB_STYLE : undefined}
              >
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: active ? TYPE_COLORS[option.type] : palette.muted }}
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
        color={category?.color ?? palette.muted}
        label={FIELD_LABELS.category}
        onPress={onPickCategory}
      >
        <Text className={INPUT_CLASS} style={category ? undefined : { color: palette.muted }}>
          {category?.name ?? SELECT_LABEL}
        </Text>
      </DetailRow>

      <DetailRow icon="account-balance-wallet" color={palette.primary.DEFAULT} label={FIELD_LABELS.card} onPress={onPickCard}>
        <Text className={INPUT_CLASS}>{card?.name ?? SELECT_LABEL}</Text>
      </DetailRow>

      <DetailRow icon="event" color={palette.primary.DEFAULT} label={FIELD_LABELS.date} onPress={onPickDate}>
        <Text className={INPUT_CLASS}>{formatLongDate(date.toISOString())}</Text>
      </DetailRow>

      <DetailRow icon="notes" color={palette.primary.DEFAULT} label={FIELD_LABELS.description} last>
        <TextInput
          className={INPUT_CLASS}
          style={{ paddingVertical: 0 }}
          placeholder={DESCRIPTION_PLACEHOLDER}
          placeholderTextColor={PLACEHOLDER_COLOR}
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </DetailRow>
    </View>
  );
}
