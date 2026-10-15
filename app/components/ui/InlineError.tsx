import React from 'react';
import { Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { tint } from '@/utils/color';

// What went wrong, inside a dialog: a toast would be drawn behind a Modal, so errors of a dialog stay in it.
export default function InlineError({ message }: { message: string | null | undefined }) {
  const colors = useColors();
  if (!message) return null;

  return (
    <View className="flex-row items-start gap-2.5 rounded-[14px] p-3 mb-3.5" style={{ backgroundColor: tint(colors.expense) }}>
      <Icon name="error-outline" size={18} color={colors.expense} />
      <Text className="flex-1 text-[12px] leading-[17px] text-ink">{message}</Text>
    </View>
  );
}
