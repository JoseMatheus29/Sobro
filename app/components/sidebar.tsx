import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useTutorialTarget } from '@/hooks/useTutorialTarget';
import { NAV_ITEMS, SIDEBAR_ITEM_HEIGHT, type NavItem } from '@/types/components/sidebar-type';
import { TAB_TUTORIAL_TARGETS } from '@/types/tutorial/tutorial-type';

interface NavTabProps {
  item: NavItem;
  isActive: boolean;
  onPress: () => void;
}

function NavTab({ item, isActive, onPress }: NavTabProps) {
  const colors = useColors();
  const tutorialRef = useTutorialTarget(TAB_TUTORIAL_TARGETS[item.id] ?? null);
  const color = isActive ? colors.primary.DEFAULT : colors.subtle;

  return (
    <TouchableOpacity
      ref={tutorialRef}
      activeOpacity={0.7}
      onPress={onPress}
      className="flex-1 items-center justify-center"
      style={{ height: SIDEBAR_ITEM_HEIGHT }}
    >
      {/* Indicador ativo */}
      {isActive && <View className="absolute -top-3 w-8 h-[3px] rounded-full bg-primary" />}

      <Icon name={item.icon} size={24} color={color} />
      <Text className="text-[10px] mt-1.5" style={{ color, fontWeight: isActive ? '700' : '500' }}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SideBar() {
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const currentRoute = segments[segments.length - 1];

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View
      className="absolute bottom-0 w-full bg-card rounded-t-3xl shadow-[0_-8px_20px_rgba(49,97,178,0.06)] elevation-20 pt-3 px-4 flex-row items-end justify-between"
      style={{ paddingBottom: insets.bottom + 20, borderTopWidth: colors.scheme === 'dark' ? 1 : 0, borderTopColor: colors.surface.dark }}
    >
      {NAV_ITEMS.map((item) => (
        <NavTab
          key={item.id}
          item={item}
          isActive={currentRoute === item.id}
          onPress={() => handlePress(item.route)}
        />
      ))}
    </View>
  );
}
