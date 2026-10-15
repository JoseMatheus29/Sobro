import React from 'react';
import { Linking, Text, View } from 'react-native';
import Constants from 'expo-constants';
import Icon from 'react-native-vector-icons/MaterialIcons';

import GradientButton from '@/app/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import { playStoreUrl, UPGRADE_BUTTON, UPGRADE_MESSAGE, UPGRADE_TITLE } from '@/types/components/auth/auth-type';

// Shown instead of the whole app when the server answers 426: the version is too old to be served.
export default function UpgradeRequired() {
  const colors = useColors();
  const packageName = Constants.expoConfig?.android?.package;

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-8">
      <View className="w-[72px] h-[72px] rounded-[22px] bg-primary/10 items-center justify-center mb-5">
        <Icon name="system-update" size={34} color={colors.primary.DEFAULT} />
      </View>
      <Text className="text-xl font-bold text-ink text-center">{UPGRADE_TITLE}</Text>
      <Text className="text-[14px] leading-[20px] text-muted text-center mt-2 mb-8">{UPGRADE_MESSAGE}</Text>
      {packageName ? (
        <View className="w-full">
          <GradientButton title={UPGRADE_BUTTON} icon="shop" onPress={() => Linking.openURL(playStoreUrl(packageName))} />
        </View>
      ) : null}
    </View>
  );
}
