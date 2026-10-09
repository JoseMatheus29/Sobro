import React from 'react';
import { TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

const ArrowBack = () => {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.back()}
      activeOpacity={0.7}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      accessibilityLabel="Voltar"
      className="w-9 h-9 rounded-xl bg-[#EBF1F6] items-center justify-center"
    >
      <Icon name="arrow-back" size={20} color="#3161B2" />
    </TouchableOpacity>
  );
};

export default ArrowBack;
