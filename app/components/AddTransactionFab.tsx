import React from 'react';
import { TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';

import {
  FAB_GAP,
  FAB_LABEL,
  FAB_RIGHT,
  FAB_ROUTE,
  FAB_SIZE,
  FAB_STYLE,
  SIDEBAR_HEIGHT,
} from './sidebar-type';

// Opens the new-transaction sheet. Render it next to <SideBar /> on screens where
// registering a transaction makes sense; it positions itself above the bar.
export default function AddTransactionFab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(FAB_ROUTE as any);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityLabel={FAB_LABEL}
      className="absolute rounded-full items-center justify-center"
      style={[
        FAB_STYLE,
        {
          width: FAB_SIZE,
          height: FAB_SIZE,
          right: FAB_RIGHT,
          bottom: SIDEBAR_HEIGHT + insets.bottom + FAB_GAP,
        },
      ]}
    >
      <Icon name="add" size={28} color="#fff" />
    </TouchableOpacity>
  );
}
