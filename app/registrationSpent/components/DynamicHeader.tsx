import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  const handleAmountChange = (text: string) => {
    const raw = text.replace(/\D/g, '');
    setAmount(raw);
  };

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="pb-10 px-6"
      style={{ paddingTop: insets.top + 16 }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-[30px] h-[30px] rounded-[10px] bg-white/20 items-center justify-center"
        >
          <Icon name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-[14px] font-semibold">{title}</Text>
        <View className="w-[30px]" />
      </View>

      <View className="flex-row bg-white/[.14] rounded-[11px] p-[3px] mb-5">
        {(['expense', 'income'] as TxType[]).map((t) => {
          const active = type === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[8px] ${active ? 'bg-white/[.22]' : 'bg-transparent'}`}
            >
              <Icon
                name={t === 'expense' ? 'arrow-upward' : 'arrow-downward'}
                size={14}
                color="#fff"
              />
              <Text className={`text-white text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                {t === 'expense' ? 'Saída' : 'Entrada'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="items-center">
        <Text className="text-white/65 text-[11px] mb-1">Valor</Text>
        <View className="flex-row items-baseline">
          <Text className="text-white/80 text-[22px] font-semibold mr-1">R$</Text>
          <TextInput
            className="text-white text-[34px] font-bold min-w-[100px] text-center tracking-tight"
            placeholder="0,00"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="numeric"
            value={amount ? formatAmount(amount) : ''}
            onChangeText={handleAmountChange}
          />
        </View>
      </View>
    </LinearGradient>
  );
}
