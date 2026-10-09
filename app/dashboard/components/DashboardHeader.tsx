import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DashboardHeaderProps {
  onProfilePress: () => void;
}

export default function DashboardHeader({ onProfilePress }: DashboardHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#1E3F7A', '#3161B2', '#4A74BB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-10 px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-white/70 text-sm mb-1">
            Bem-vindo de volta 👋
          </Text>
          <Text className="text-white text-2xl font-extrabold tracking-tight">
            Dashboard
          </Text>
        </View>
        <TouchableOpacity
          onPress={onProfilePress}
          className="w-11 h-11 rounded-full bg-white/20 items-center justify-center"
        >
          <Icon name="person" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
