import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { ALL_ACCOUNTS_LABEL, type AccountFilterProps } from '@/types/myDetailing/myDetailing-type';
import { tint } from '@/utils/color';

// "Todas" or one account: everything below it on the screen is about what was picked.
export default function AccountFilter({ accounts, selectedId, onSelect }: AccountFilterProps) {
  const colors = useColors();
  const options = [{ id: null, name: ALL_ACCOUNTS_LABEL }, ...accounts];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-4"
      contentContainerClassName="px-4 gap-2"
    >
      {options.map((option) => {
        const active = option.id === selectedId;
        return (
          <TouchableOpacity
            key={option.id ?? 'all'}
            onPress={() => onSelect(option.id)}
            activeOpacity={0.8}
            accessibilityState={{ selected: active }}
            className="h-9 px-3.5 rounded-full items-center justify-center border"
            style={{
              borderColor: active ? colors.primary.DEFAULT : colors.line,
              backgroundColor: active ? tint(colors.primary.DEFAULT) : 'transparent',
            }}
          >
            <Text
              className="text-[13px]"
              style={{ color: active ? colors.primary.DEFAULT : colors.muted, fontWeight: active ? '700' : '500' }}
            >
              {option.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
