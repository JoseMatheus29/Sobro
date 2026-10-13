import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientButton from '@/app/components/ui/GradientButton';
import { FlowButtonProps, TYPE_GRADIENTS } from '@/types/registrationSpent/registrationSpent-type';
import { useColors } from '@/hooks/useColors';

export default function FlowButton({ label, type, onPress, disabled, compact }: FlowButtonProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5 pt-3" style={{ paddingBottom: compact ? 12 : Math.max(insets.bottom, 12) + 16 }}>
      <View pointerEvents={disabled ? 'none' : 'auto'}>
        <GradientButton
          title={label}
          onPress={onPress}
          colors={disabled ? colors.disabledGradient : TYPE_GRADIENTS[type]}
          shadowColor={disabled ? colors.disabledGradient[0] : TYPE_GRADIENTS[type][0]}
        />
      </View>
    </View>
  );
}
