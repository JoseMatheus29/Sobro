import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  icon?: string;
  colors?: [string, string, string] | [string, string];
  shadowColor?: string;
}

export default function GradientButton({
  title,
  onPress,
  icon,
  colors = ['#3161B2', '#4A74BB'],
  shadowColor = '#3161B2'
}: GradientButtonProps) {
  return (
    <Pressable onPress={onPress}>
      {/* LinearGradient ignores borderRadius on Android, so the rounding is done
          by a clipping wrapper; the outer View carries the shadow, which the
          clip would otherwise cut off on iOS. */}
      <View
        className="rounded-2xl shadow-xl elevation-8"
        style={{ shadowColor, backgroundColor: colors[0] }}
      >
        <View className="rounded-2xl overflow-hidden">
          <LinearGradient
            colors={colors}
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
