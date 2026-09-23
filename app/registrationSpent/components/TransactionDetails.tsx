import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TransactionDetailsProps {
  nome: string;
  setNome: (v: string) => void;
  descricao: string;
  setDescricao: (v: string) => void;
  focused: string;
  setFocused: (v: string) => void;
  primaryColor: string;
  date: Date;
  setDate: (d: Date) => void;
}

export default function TransactionDetails({
  nome, setNome, descricao, setDescricao, focused, setFocused, primaryColor, date, setDate
}: TransactionDetailsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View className="bg-white rounded-[24px] p-5 mb-6 shadow-lg shadow-black/5 elevation-4">
      <Text className="text-[13px] font-bold text-[#1A2B4A] mb-3.5">Detalhes</Text>

      {/* Nome */}
      <View className="mb-3.5">
        <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">Nome</Text>
        <View className={`flex-row items-center bg-[#F7F9FC] rounded-[14px] border-[1.5px] px-3.5 h-[50px] ${focused === 'nome' ? 'border-[#3161B2]' : 'border-[#E8EEF5]'}`}>
          <Icon name="edit" size={16} color={focused === 'nome' ? primaryColor : '#A0AEC0'} />
          <TextInput
            className="flex-1 ml-2.5 text-[14px] text-[#1A2B4A]"
            placeholder="Ex: Almoço no restaurante"
            placeholderTextColor="#C0CCDA"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="sentences"
            onFocus={() => setFocused('nome')}
            onBlur={() => setFocused('')}
          />
        </View>
      </View>

      {/* Descrição */}
      <View className="mb-3.5">
        <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">Descrição (opcional)</Text>
        <View className={`bg-[#F7F9FC] rounded-[14px] border-[1.5px] px-3.5 py-3 ${focused === 'desc' ? 'border-[#3161B2]' : 'border-[#E8EEF5]'}`}>
          <TextInput
            className="text-[14px] text-[#1A2B4A] min-h-[60px]"
            style={{ textAlignVertical: 'top' }}
            placeholder="Adicione uma observação..."
            placeholderTextColor="#C0CCDA"
            value={descricao}
            onChangeText={setDescricao}
            multiline
            numberOfLines={3}
            onFocus={() => setFocused('desc')}
            onBlur={() => setFocused('')}
          />
        </View>
      </View>

      {/* Data */}
      <View>
        <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">Data</Text>
        <TouchableOpacity
          className="flex-row items-center bg-[#F7F9FC] rounded-[14px] border-[1.5px] border-[#E8EEF5] px-3.5 h-[50px]"
          onPress={() => setShowPicker(true)}
        >
          <Icon name="calendar-today" size={16} color="#A0AEC0" />
          <Text className="ml-2.5 text-[14px] text-[#718096]">
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Icon name="chevron-right" size={18} color="#C0CCDA" className="ml-auto" />
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_event, selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}
      </View>
    </View>
  );
}
