import React, { useMemo } from 'react';
import { View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import ManagedBanner from '@/app/components/profile/ManagedBanner';
import { useProfiles } from '@/hooks/useProfiles';

// Puts the banner of a profile of someone else above the screens. Each screen leaves room for the status bar by itself
// (`useSafeAreaInsets().top`); with the banner in that place they would leave it twice, so they are told there is none.
// The tree is the same with or without the banner: the Stack below must not be mounted again when it comes and goes.
export default function ProfileFrame({ children }: { children: React.ReactNode }) {
  const { active } = useProfiles();
  const insets = useSafeAreaInsets();
  const below = useMemo(() => (active ? { ...insets, top: 0 } : insets), [active, insets]);

  return (
    <View style={{ flex: 1 }}>
      <ManagedBanner />
      <View style={{ flex: 1 }}>
        <SafeAreaInsetsContext.Provider value={below}>{children}</SafeAreaInsetsContext.Provider>
      </View>
    </View>
  );
}
