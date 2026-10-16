import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { resetTutorial } from '@/db/tutorial';
import { useProfile } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import { REPLAY_TUTORIAL_LABEL, REPLAY_TUTORIAL_TEXT, REPLAY_TUTORIAL_TITLE } from '@/types/tutorial/tutorial-type';

// "Rever tutorial": clears the flag of this account and goes to the Home, which starts the tutorial again.
export default function TutorialCard() {
  const colors = useColors();
  const router = useRouter();
  const { profile } = useProfile();

  const handleReplay = async () => {
    if (!profile) return;
    await resetTutorial(profile.id);
    // The same way the tab bar goes there.
    router.push('/dashboard' as any);
  };

  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="school" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">{REPLAY_TUTORIAL_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{REPLAY_TUTORIAL_TEXT}</Text>

      <TouchableOpacity
        onPress={handleReplay}
        disabled={!profile}
        activeOpacity={0.85}
        className="h-12 mt-4 rounded-2xl flex-row items-center justify-center gap-1.5 border-[1.5px]"
        style={{ backgroundColor: colors.canvas, borderColor: colors.surface.dark, opacity: profile ? 1 : 0.5 }}
      >
        <Icon name="replay" size={18} color={colors.primary.DEFAULT} />
        <Text className="text-[14px] font-bold text-primary">{REPLAY_TUTORIAL_LABEL}</Text>
      </TouchableOpacity>
    </View>
  );
}
