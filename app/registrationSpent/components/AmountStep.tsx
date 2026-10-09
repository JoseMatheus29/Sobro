import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import {
  AmountStepProps,
  CONTINUE_LABEL,
  KEYPAD_KEYS,
  MAX_AMOUNT_DIGITS,
  TOGGLE_THUMB_STYLE,
  TX_TYPE_OPTIONS,
  TYPE_COLORS,
} from '../registrationSpent-type';
import { formatCents } from '../utils';
import FlowButton from './FlowButton';

export default function AmountStep({ type, setType, amount, setAmount, typeColor, onNext }: AmountStepProps) {
  const cents = parseInt(amount || '0', 10) || 0;

  const press = (key: string) => {
    if (key === 'back') setAmount(amount.slice(0, -1));
    else setAmount((amount + key).replace(/^0+/, '').slice(0, MAX_AMOUNT_DIGITS));
  };

  return (
    <View className="flex-1">
      {/* The selected side is a white thumb and only its text takes the type color.
          The thumb's shadow lives in `style`, not `className`: adding classes that use
          CSS variables (shadow-*) after the first render makes NativeWind remount the
          component and, in dev, crash with a "navigation context" error. */}
      <View className="mx-5 mt-3.5 p-1 rounded-2xl bg-surface flex-row gap-1">
        {TX_TYPE_OPTIONS.map((option) => {
          const active = type === option.type;
          const color = active ? TYPE_COLORS[option.type] : palette.muted;
          return (
            <TouchableOpacity
              key={option.type}
              onPress={() => setType(option.type)}
              activeOpacity={0.85}
              accessibilityState={{ selected: active }}
              className="flex-1 h-11 rounded-xl flex-row items-center justify-center gap-1.5"
              style={active ? TOGGLE_THUMB_STYLE : undefined}
            >
              <Icon name={option.icon} size={16} color={color} />
              <Text className="text-sm font-bold" style={{ color }}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="flex-1 items-center justify-center">
        <Text className="text-[13px] font-medium text-muted">Valor (R$)</Text>
        <Text
          style={{
            fontSize: 64,
            fontWeight: '900',
            letterSpacing: -2,
            color: cents > 0 ? typeColor : '#B8C2D0',
          }}
        >
          {formatCents(cents)}
        </Text>
      </View>

      <View className="px-5 flex-row flex-wrap">
        {KEYPAD_KEYS.map((key) => (
          <TouchableOpacity
            key={key}
            onPress={() => press(key)}
            onLongPress={key === 'back' ? () => setAmount('') : undefined}
            accessibilityLabel={key === 'back' ? 'Apagar' : key}
            activeOpacity={0.6}
            className="w-1/3 h-16 items-center justify-center rounded-2xl"
          >
            {key === 'back' ? (
              <Icon name="backspace" size={26} color={palette.ink} />
            ) : (
              <Text className="text-[28px] font-medium text-ink">{key}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlowButton
        label={CONTINUE_LABEL}
        type={type}
        disabled={cents === 0}
        onPress={onNext}
      />
    </View>
  );
}
