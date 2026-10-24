import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';

interface ProfileHeaderProps {
  name: string;
  /** The title on top; "Meu Perfil" unless the page is another profile's. */
  title?: string;
}

export default function ProfileHeader({ name, title = 'Meu Perfil' }: ProfileHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={colors.headerGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-[52px] px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-center min-h-9 mb-6">
        <Text numberOfLines={1} className="text-headerInk text-xl font-bold">{title}</Text>
      </View>

      <View className="items-center">
        <View className="w-[86px] h-[86px] rounded-full bg-headerInk/20 items-center justify-center border-4 border-headerInk/50">
          <Icon name="person" size={44} color={colors.headerInk} />
        </View>
        <Text className="text-headerInk text-[17px] font-bold mt-2.5">{name || 'Seu nome'}</Text>
      </View>
    </LinearGradient>
  );
}
