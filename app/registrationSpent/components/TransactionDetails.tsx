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
    <View>
      <Text className="text-[13.5px] font-semibold text-ink mb-3">Detalhes</Text>

      {/* Nome */}
      <View className="mb-3">
        <Text className="text-xs text-muted mb-1">Nome</Text>
        <View className={`flex-row items-center bg-canvas rounded-xl border px-3.5 h-[46px] ${focused === 'nome' ? 'border-primary' : 'border-transparent'}`}>
          <Icon name="edit" size={15} color={focused === 'nome' ? primaryColor : '#A0AEC0'} />
          <TextInput
            className="flex-1 ml-2.5 text-[14px] text-ink"
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
      <View className="mb-3">
        <Text className="text-xs text-muted mb-1">Descrição (opcional)</Text>
        <View className={`bg-canvas rounded-xl border px-3.5 py-3 ${focused === 'desc' ? 'border-primary' : 'border-transparent'}`}>
          <TextInput
            className="text-[14px] text-ink min-h-[56px]"
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
        <Text className="text-xs text-muted mb-1">Data</Text>
        <TouchableOpacity
          className="flex-row items-center bg-canvas rounded-xl border border-transparent px-3.5 h-[46px]"
          onPress={() => setShowPicker(true)}
        >
          <Icon name="calendar-today" size={15} color="#A0AEC0" />
          <Text className="ml-2.5 text-[14px] text-ink">
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
          <Icon name="chevron-right" size={18} color="#C0CCDA" style={{ marginLeft: 'auto' }} />
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
