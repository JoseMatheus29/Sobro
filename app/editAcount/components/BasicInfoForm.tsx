import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Field from '@/app/components/ui/Field';
import { useColors } from '@/hooks/useColors';

interface BasicInfoFormProps {
  nome: string;
  setNome: (v: string) => void;
}

export default function BasicInfoForm({ nome, setNome }: BasicInfoFormProps) {
  const colors = useColors();
  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-4">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="person" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">Informações Básicas</Text>
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
