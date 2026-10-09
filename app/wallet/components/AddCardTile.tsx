import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { ADD_CARD_HINT, ADD_CARD_LABEL, AddCardTileProps } from '../wallet-type';

// Same height as Card so the carousel doesn't jump when it scrolls into view.
export default function AddCardTile({ width, onPress }: AddCardTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={{ width }}
      className="h-[180px] rounded-3xl bg-white border-2 border-dashed border-primary-lighter items-center justify-center"
    >
      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-3">
        <Icon name="add" size={26} color={palette.primary.DEFAULT} />
      </View>
      <Text className="text-sm font-bold text-primary">{ADD_CARD_LABEL}</Text>
      <Text className="text-[11px] text-subtle mt-0.5">{ADD_CARD_HINT}</Text>
    </TouchableOpacity>
  );
}
