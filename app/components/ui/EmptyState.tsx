import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';

interface EmptyStateProps {
  icon: string;
  message: string;
}

// Placeholder with the footprint of a list row, so an empty section keeps its place in the layout.
export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <View className="flex-row items-center bg-white rounded-2xl p-3.5 mb-2.5 border border-dashed border-surface-dark">
      <View className="w-[46px] h-[46px] rounded-[14px] items-center justify-center mr-3 bg-surface">
        <Icon name={icon} size={22} color={palette.subtle} />
      </View>
      <Text className="flex-1 text-sm text-muted">{message}</Text>
    </View>
  );
}
