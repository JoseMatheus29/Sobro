import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import {
  BANNER_BACK_ACCESSIBILITY,
  BANNER_BACK_LABEL,
  BANNER_MIN_HEIGHT,
  BANNER_SEEING_LABEL,
  BANNER_TITLE,
} from '@/types/profiles/profiles-type';
import { tint } from '@/utils/color';

// The strip on top of every screen while another person's finances are open, so nobody registers a purchase in the
// wrong profile without noticing. It takes the room of the status bar (ProfileFrame tells the screens below it).
export default function ManagedBanner() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { active, switchTo } = useProfiles();
  if (!active) return null;

  return (
    <View
      accessibilityRole="summary"
      style={{
        paddingTop: insets.top,
        backgroundColor: tint(colors.managed),
        borderBottomWidth: 1,
        borderBottomColor: `${colors.managed}66`,
      }}
    >
      <View className="flex-row items-center gap-3 pl-5 pr-4" style={{ minHeight: BANNER_MIN_HEIGHT }}>
        <Icon name="visibility" size={22} color={colors.managed} />
        <View className="flex-1">
          <Text className="text-xs text-muted">{BANNER_SEEING_LABEL}</Text>
          <Text numberOfLines={1} className="text-[15px] font-bold text-ink mt-px">{BANNER_TITLE(active.name)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => switchTo(null)}
          activeOpacity={0.8}
          accessibilityLabel={BANNER_BACK_ACCESSIBILITY}
          className="h-11 px-3.5 rounded-[14px] items-center justify-center"
          style={{ borderWidth: 1.5, borderColor: colors.managed }}
        >
          <Text className="text-[13px] font-bold" style={{ color: colors.managed }}>{BANNER_BACK_LABEL}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
