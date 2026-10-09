import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { FlowHeaderProps, STEP_COUNT, STEP_NAMES } from '../registrationSpent-type';

// Light header; the brand blue shows up in the button icon, the progress and the step name.
export default function FlowHeader({ title, step, onBack }: FlowHeaderProps) {
  return (
    <View>
      {/* Drag handle: marks the screen as a sheet */}
      <View className="items-center pt-2.5">
        <View className="w-10 h-1 rounded-full bg-surface-dark" />
      </View>

      <View className="h-14 items-center justify-center">
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel={step === 1 ? 'Fechar' : 'Voltar'}
          className="absolute left-3 w-11 h-11 rounded-[14px] bg-surface items-center justify-center"
        >
          <Icon name={step === 1 ? 'close' : 'arrow-back'} size={22} color={palette.primary.DEFAULT} />
        </TouchableOpacity>
        <Text className="text-[17px] font-bold text-ink">{title}</Text>
      </View>

      <View className="flex-row gap-1.5 px-5 pt-1">
        {STEP_NAMES.map((name, i) => (
          <View
            key={name}
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i < step ? palette.primary.DEFAULT : palette.surface.dark }}
          />
        ))}
      </View>
      <Text className="px-5 pt-3 text-[13px] text-muted">
        Passo {step} de {STEP_COUNT} · <Text className="font-bold text-primary">{STEP_NAMES[step - 1]}</Text>
      </Text>
    </View>
  );
}
