import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import { palette } from '@/constants/palette';
import { NAV_ITEMS, SIDEBAR_ITEM_HEIGHT } from './sidebar-type';

export default function SideBar() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentRoute = segments[segments.length - 1];

  const handlePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View
      className="absolute bottom-0 w-full bg-white rounded-t-3xl shadow-[0_-8px_20px_rgba(49,97,178,0.06)] elevation-20 pt-3 px-4 flex-row items-end justify-between"
      style={{ paddingBottom: insets.bottom + 20 }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = currentRoute === item.id;
        const color = isActive ? palette.primary.DEFAULT : palette.subtle;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.7}
            onPress={() => handlePress(item.route)}
            className="flex-1 items-center justify-center"
            style={{ height: SIDEBAR_ITEM_HEIGHT }}
          >
            {/* Indicador ativo */}
            {isActive && (
              <View className="absolute -top-3 w-8 h-[3px] rounded-full bg-primary" />
            )}

            <Icon name={item.icon} size={24} color={color} />
            <Text
              className="text-[10px] mt-1.5"
              style={{ color, fontWeight: isActive ? '700' : '500' }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
