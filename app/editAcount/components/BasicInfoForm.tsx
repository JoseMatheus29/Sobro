import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Field from '../../components/ui/Field';

interface BasicInfoFormProps {
  nome: string;
  setNome: (v: string) => void;
}

export default function BasicInfoForm({ nome, setNome }: BasicInfoFormProps) {
  return (
    <View className="bg-white rounded-[24px] p-5 mb-4 shadow-lg shadow-[#3161B2]/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-xl bg-[#3161B2]/10 items-center justify-center">
          <Icon name="person" size={16} color="#3161B2" />
        </View>
        <Text className="text-[15px] font-bold text-[#1A2B4A]">Informações Básicas</Text>
      </View>

      <Field
        label="Nome completo"
        placeholder="João Silva Souza"
        value={nome}
        onChangeText={setNome}
        icon="badge"
        autoCapitalize="words"
      />
    </View>
  );
}
