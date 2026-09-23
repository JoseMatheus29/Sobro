import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { TxType } from '../registrationSpent-type';

interface DynamicHeaderProps {
  title: string;
  type: TxType;
  setType: (t: TxType) => void;
  amount: string;
  setAmount: (v: string) => void;
  gradientColors: [string, string, string];
  formatAmount: (v: string) => string;
}

export default function DynamicHeader({
  title, type, setType, amount, setAmount, gradientColors, formatAmount
}: DynamicHeaderProps) {
  const router = useRouter();

  const handleAmountChange = (text: string) => {
    const raw = text.replace(/\D/g, '');
    setAmount(raw);
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pt-14 pb-[52px] px-6"
    >
      <View className="flex-row items-center justify-between mb-7">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
        >
          <Icon name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-[17px] font-bold">{title}</Text>
        <View className="w-9" />
      </View>

      <View className="flex-row bg-white/15 rounded-[14px] p-1 mb-7">
        {(['expense', 'income'] as TxType[]).map((t) => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-[11px] ${active ? 'bg-white/25' : 'bg-transparent'}`}
            >
              <Icon
                name={t === 'expense' ? 'arrow-upward' : 'arrow-downward'}
                size={16}
                color="#fff"
              />
              <Text className={`text-white text-sm ${active ? 'font-bold' : 'font-normal'}`}>
                {t === 'expense' ? 'Saída' : 'Entrada'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="items-center">
        <Text className="text-white/70 text-[13px] font-medium mb-1.5">Valor</Text>
        <View className="flex-row items-center">
          <Text className="text-white/80 text-[28px] font-bold mr-1">R$</Text>
          <TextInput
            className="text-white text-[42px] font-extrabold min-w-[100px] text-center"
            placeholder="0,00"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            value={amount ? formatAmount(amount) : ''}
            onChangeText={handleAmountChange}
          />
        </View>
        <View className="h-0.5 w-[140px] bg-white/35 mt-1 rounded-[1px]" />
      </View>
    </LinearGradient>
  );
}
