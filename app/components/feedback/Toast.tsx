import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  feedbackStyles,
  TOAST_SHADOW,
  TOAST_SIDE_MARGIN,
  TOAST_SLIDE_DISTANCE,
  TOAST_TOP_GAP,
  ToastProps,
} from '@/types/components/feedback/feedback-type';
import { useColors } from '@/hooks/useColors';

// A white card like the ones on screen: the result color lives only in the icon square.
export default function Toast({ toast, progress, onPress }: ToastProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (!toast) return null;

  const look = feedbackStyles(colors)[toast.type];

  // Position and animation go in `style`: className is not applied to Animated components.
  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + TOAST_TOP_GAP,
        left: TOAST_SIDE_MARGIN,
        right: TOAST_SIDE_MARGIN,
        opacity: progress,
        transform: [
          { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [TOAST_SLIDE_DISTANCE, 0] }) },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="alert"
        className="flex-row items-center gap-3 bg-card rounded-[20px] border border-surface px-3.5 py-3"
        style={TOAST_SHADOW}
      >
        <View className="w-11 h-11 rounded-[14px] items-center justify-center" style={{ backgroundColor: look.tint }}>
          <Icon name={toast.icon ?? look.icon} size={24} color={look.color} />
        </View>
        <View style={{ flexShrink: 1 }}>
          <Text className="text-base font-bold text-ink">{toast.title}</Text>
          {toast.message ? <Text className="text-sm text-muted mt-0.5">{toast.message}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
