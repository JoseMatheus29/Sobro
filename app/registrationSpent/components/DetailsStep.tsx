import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { palette } from '@/constants/palette';
import { CHANGE_LABEL, DetailsStepProps } from '../registrationSpent-type';

export default function DetailsStep({
  typeColor, amountText, category, nome, setNome, descricao, setDescricao,
  cards, selectedCardId, setSelectedCardId, date, setDate, onEditAmount, onEditCategory,
}: DetailsStepProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pt-5 pb-3 gap-3"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Resumo dos passos anteriores, cada linha leva de volta ao seu passo. */}
      <View className="bg-white rounded-[20px] overflow-hidden">
        <TouchableOpacity onPress={onEditAmount} activeOpacity={0.7} className="h-16 px-4 flex-row items-center">
          <View className="flex-1">
            <Text className="text-xs text-muted">Valor</Text>
            <Text className="text-xl font-bold" style={{ color: typeColor }}>R$ {amountText}</Text>
          </View>
          <Text className="text-[13px] font-bold text-primary">{CHANGE_LABEL}</Text>
        </TouchableOpacity>
        <View className="h-px bg-line mx-4" />
        <TouchableOpacity onPress={onEditCategory} activeOpacity={0.7} className="h-16 px-4 flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-[14px] items-center justify-center"
            style={{ backgroundColor: category ? `${category.color}1F` : palette.surface.DEFAULT }}
          >
            <Icon name={category?.icon ?? 'category'} size={20} color={category?.color ?? palette.muted} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted">Categoria</Text>
            <Text className="text-base font-medium text-ink">{category?.name ?? 'Selecionar'}</Text>
          </View>
          <Text className="text-[13px] font-bold text-primary">{CHANGE_LABEL}</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-[20px] px-4 py-1">
        <View className="py-3 border-b border-line">
          <Text className="text-xs text-muted">Nome</Text>
          <TextInput
            className="text-base font-medium text-ink pt-1 pb-0"
            placeholder="Ex: Almoço no restaurante"
            placeholderTextColor="#8391A5"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="sentences"
          />
        </View>
        <View className="py-3">
          <Text className="text-xs text-muted">Descrição (opcional)</Text>
          <TextInput
            className="text-base font-medium text-ink pt-1 pb-0"
            placeholder="Adicione uma observação"
            placeholderTextColor="#8391A5"
            value={descricao}
            onChangeText={setDescricao}
            multiline
          />
        </View>
      </View>

      <Text className="text-[13px] font-bold text-muted mt-1 ml-1">Conta</Text>
      <View className="bg-white rounded-[20px] overflow-hidden">
        {cards.map((card, i) => {
          const active = selectedCardId === card.id;
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => setSelectedCardId(card.id)}
              activeOpacity={0.8}
              accessibilityState={{ selected: active }}
              className={`h-[60px] px-4 flex-row items-center gap-3 ${i > 0 ? 'border-t border-line' : ''}`}
              style={{ backgroundColor: active ? `${typeColor}0F` : '#fff' }}
            >
              <View className="w-10 h-10 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${card.color}1F` }}>
                <Icon name="credit-card" size={20} color={card.color} />
              </View>
              <View className="flex-1">
                <Text className={`text-[15px] text-ink ${active ? 'font-bold' : 'font-medium'}`}>{card.name}</Text>
                <Text className="text-xs text-muted">•••• {card.number}</Text>
              </View>
              <Icon
                name={active ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={22}
                color={active ? typeColor : '#C0CCDA'}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        activeOpacity={0.8}
        className="h-16 bg-white rounded-[20px] px-4 flex-row items-center gap-3"
      >
        <View className="w-10 h-10 rounded-[14px] bg-surface items-center justify-center">
          <Icon name="event" size={20} color={palette.primary.DEFAULT} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted">Data</Text>
          <Text className="text-base font-medium text-ink">
            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <Text className="text-[13px] font-bold text-primary">{CHANGE_LABEL}</Text>
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
    </ScrollView>
  );
}
