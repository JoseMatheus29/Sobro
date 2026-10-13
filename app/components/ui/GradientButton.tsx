import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  /** Left-to-right gradient; the theme's main-button gradient by default. */
  colors?: [string, string, string] | [string, string];
  shadowColor?: string;
}

export default function GradientButton({ title, onPress, icon, colors, shadowColor }: GradientButtonProps) {
  const theme = useColors();
  const fill = colors ?? theme.buttonGradient;
  const shadow = shadowColor ?? theme.buttonGradient[0];

  return (
    <Pressable onPress={onPress}>
      {/* LinearGradient ignores borderRadius on Android, so the rounding is done
          by a clipping wrapper; the outer View carries the shadow, which the
          clip would otherwise cut off on iOS. */}
      <View
        className="rounded-2xl shadow-xl elevation-8"
        style={{ shadowColor: shadow, backgroundColor: fill[0] }}
      >
        <View className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={fill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="h-[54px] items-center justify-center flex-row gap-2"
          >
            {icon && <Icon name={icon} size={20} color="#fff" />}
            <Text className="text-white text-base font-bold">{title}</Text>
          </LinearGradient>
        </View>
      </View>
    </Pressable>
  );
}
