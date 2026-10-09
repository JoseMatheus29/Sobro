import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ProfileHeaderProps {
  name: string;
  avatarUri: string | null;
  onPickAvatar: () => void;
}

export default function ProfileHeader({ name, avatarUri, onPickAvatar }: ProfileHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#1E3F7A', '#3161B2', '#4A74BB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-[52px] px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-center min-h-9 mb-6">
        <Text className="text-white text-xl font-bold">Meu Perfil</Text>
      </View>

      {/* Avatar centralizado */}
      <View className="items-center">
        <View className="relative">
          <View className="w-[86px] h-[86px] rounded-full bg-white/20 items-center justify-center border-4 border-white/50 overflow-hidden">
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} className="w-full h-full" />
            ) : (
              <Icon name="person" size={44} color="#fff" />
            )}
          </View>
          <TouchableOpacity
            onPress={onPickAvatar}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white items-center justify-center shadow-md elevation-4"
          >
            <Icon name="camera-alt" size={14} color="#3161B2" />
          </TouchableOpacity>
        </View>
        <Text className="text-white text-[17px] font-bold mt-2.5">{name || 'Seu nome'}</Text>
      </View>
    </LinearGradient>
  );
}
