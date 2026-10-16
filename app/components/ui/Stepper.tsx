import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';

interface StepperProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}

// A number with a minus and a plus: the parcels of a plan, the closing day of a card.
export default function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const colors = useColors();
  return (
    <View className="flex-1 bg-card rounded-2xl border-[1.5px] border-line px-2.5 py-2">
      <Text className="text-[11px] text-subtle mb-1">{label}</Text>
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - 1))}
          accessibilityLabel={`Menos: ${label}`}
          className="w-9 h-9 rounded-xl bg-surface items-center justify-center"
        >
          <Icon name="remove" size={20} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
        <Text className="text-lg font-extrabold text-ink">{value}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 1))}
          accessibilityLabel={`Mais: ${label}`}
          className="w-9 h-9 rounded-xl bg-surface items-center justify-center"
        >
          <Icon name="add" size={20} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
