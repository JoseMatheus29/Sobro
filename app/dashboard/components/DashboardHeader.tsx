import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import MonthPill from '@/app/components/month/MonthPill';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';
import ProfileSwitcher from '@/app/components/profile/ProfileSwitcher';
import { DashboardHeaderProps, GREETING } from '@/types/dashboard/dashboard-type';
import { CHIP_ACCESSIBILITY } from '@/types/profiles/profiles-type';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { shortName } from '@/utils/profiles';

// The greeting on the left and the month on the right, on one line; the summary card overlaps
// the lower edge. For someone who cares for other people's finances the greeting is a chip that opens the sheet to
// switch profiles (and names the profile that is open); for everyone else it is the plain greeting.
export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const colors = useColors();
  const firstName = userName?.trim().split(/\s+/)[0];
  const insets = useSafeAreaInsets();
  const { profiles, active } = useProfiles();
  const [switching, setSwitching] = useState(false);

  const greeting = firstName ? `${GREETING}, ${firstName}` : GREETING;
  const chipName = active ? active.name : userName?.trim() ?? '';

  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-16 px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between gap-3">
        {profiles.length > 0 ? (
          <View className="flex-1 flex-row">
            <TouchableOpacity
              onPress={() => setSwitching(true)}
              activeOpacity={0.8}
              accessibilityLabel={CHIP_ACCESSIBILITY(chipName)}
              className="flex-row items-center gap-2 h-11 pl-1.5 pr-2.5 rounded-full"
              style={{
                maxWidth: '100%',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: active ? `${colors.managed}8C` : colors.surface.dark,
              }}
            >
              <ProfileAvatar name={chipName} size={32} managed={active !== null} />
              <Text numberOfLines={1} className="shrink text-base font-bold text-ink">
                {active ? shortName(active.name) : greeting}
              </Text>
              <Icon name="expand-more" size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text numberOfLines={1} className="flex-1 text-headerInk text-2xl font-extrabold tracking-tight">
            {greeting}
          </Text>
        )}
        <MonthPill />
      </View>

      <ProfileSwitcher visible={switching} onClose={() => setSwitching(false)} />
    </LinearGradient>
  );
}
