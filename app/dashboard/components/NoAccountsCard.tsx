import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import GradientButton from '@/app/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import {
  NO_ACCOUNTS_CREATE_LABEL,
  NO_ACCOUNTS_IMPORT_LABEL,
  NO_ACCOUNTS_TEXT,
  NO_ACCOUNTS_TITLE,
  type NoAccountsCardProps,
} from '@/types/profiles/profiles-type';
import { tint } from '@/utils/color';

// What the Home says when there is not a single account to add up: a profile that was just made. Nothing is drawn as
// zeros, as if there were figures; the way forward is the first account.
export default function NoAccountsCard({ name, onCreate, onImport }: NoAccountsCardProps) {
  const colors = useColors();

  return (
    <View className="bg-card rounded-[24px] px-6 pt-7 pb-4 items-center border border-surface-dark">
      <View className="w-16 h-16 rounded-[20px] items-center justify-center" style={{ backgroundColor: tint(colors.managed) }}>
        <Icon name="account-balance-wallet" size={30} color={colors.managed} />
      </View>
      <Text className="text-xl font-extrabold text-ink text-center mt-[18px]">{NO_ACCOUNTS_TITLE(name)}</Text>
      <Text className="text-sm leading-[21px] text-muted text-center mt-2">{NO_ACCOUNTS_TEXT}</Text>

      <View className="self-stretch mt-[22px]">
        <GradientButton title={NO_ACCOUNTS_CREATE_LABEL} icon="add" onPress={onCreate} />
      </View>
      <TouchableOpacity onPress={onImport} activeOpacity={0.7} className="h-11 px-3 mt-1 items-center justify-center">
        <Text className="text-sm font-bold text-primary">{NO_ACCOUNTS_IMPORT_LABEL}</Text>
      </TouchableOpacity>
    </View>
  );
}
