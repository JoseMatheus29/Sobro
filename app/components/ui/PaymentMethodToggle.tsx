import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { type PaymentMethod } from '@/db/transactions';
import { useColors } from '@/hooks/useColors';
import { PAYMENT_OPTIONS } from '@/types/components/ui/payment-type';
import { toggleThumbStyle } from '@/types/registrationSpent/registrationSpent-type';

interface PaymentMethodToggleProps {
  /** Null while the expense says nothing about how it was paid (the old ones): none is marked. */
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
  /** Credit only exists on an account with a credit card; on any other one the choice is Pix or debit. */
  creditAvailable: boolean;
}

// Pix, débito or crédito, in the same segmented style as the Repetir options.
export default function PaymentMethodToggle({ value, onChange, creditAvailable }: PaymentMethodToggleProps) {
  const colors = useColors();
  const options = PAYMENT_OPTIONS.filter((option) => option.method !== 'credit' || creditAvailable);
  return (
    <View className="flex-row bg-surface rounded-2xl p-1 gap-1">
      {options.map((option) => {
        const active = option.method === value;
        return (
          <TouchableOpacity
            key={option.method}
            onPress={() => onChange(option.method)}
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
  );
}
