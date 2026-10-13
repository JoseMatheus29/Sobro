import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { DetailRowProps } from '@/types/detailsSpend/detailsSpend-type';

// One field of the form: tinted icon square, small label and the control under it.
export default function DetailRow({ icon, color, label, last, onPress, children }: DetailRowProps) {
  const colors = useColors();
  const body = (
    <>
      <View
        className="w-10 h-10 rounded-[14px] items-center justify-center"
        style={{ backgroundColor: `${color}1F` }}
      >
        <Icon name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        {children}
      </View>
      {onPress && <Icon name="chevron-right" size={20} color={colors.subtle} />}
    </>
  );
  const className = `flex-row items-center gap-3 py-3 ${last ? '' : 'border-b border-line'}`;

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} className={className}>
        {body}
      </TouchableOpacity>
    );
  }
  return <View className={className}>{body}</View>;
}
