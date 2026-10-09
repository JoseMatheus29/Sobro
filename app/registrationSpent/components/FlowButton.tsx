import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GradientButton from '../../components/ui/GradientButton';
import { DISABLED_GRADIENT, FlowButtonProps, TYPE_COLORS, TYPE_GRADIENTS } from '../registrationSpent-type';

export default function FlowButton({ label, type, onPress, disabled, compact }: FlowButtonProps) {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-5 pt-3" style={{ paddingBottom: compact ? 12 : Math.max(insets.bottom, 12) + 16 }}>
      <View pointerEvents={disabled ? 'none' : 'auto'}>
        <GradientButton
          title={label}
          onPress={onPress}
          colors={disabled ? DISABLED_GRADIENT : TYPE_GRADIENTS[type]}
          shadowColor={disabled ? DISABLED_GRADIENT[0] : TYPE_COLORS[type]}
        />
      </View>
    </View>
  );
}
