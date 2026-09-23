import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { type CardRecord } from '@/db/cards';

interface CardSelectorProps {
  cards: CardRecord[];
  selectedCardId: number | null;
  setSelectedCardId: (id: number) => void;
}

export default function CardSelector({ cards, selectedCardId, setSelectedCardId }: CardSelectorProps) {
  return (
    <View className="bg-white rounded-[24px] p-5 mb-4 shadow-lg shadow-black/5 elevation-4">
      <Text className="text-[13px] font-bold text-[#1A2B4A] mb-3.5">Conta</Text>
      <View className="flex-row flex-wrap gap-2.5">
        {cards.map((card) => {
          const active = selectedCardId === card.id;
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => setSelectedCardId(card.id)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border-[1.5px] ${active ? '' : 'bg-[#F7F9FC] border-transparent'}`}
              style={{ backgroundColor: active ? `${card.color}1F` : undefined, borderColor: active ? card.color : undefined }}
            >
              <Icon name="credit-card" size={16} color={active ? card.color : '#A0AEC0'} />
              <Text className={`text-xs ${active ? 'font-bold' : 'font-medium'}`} style={{ color: active ? card.color : '#718096' }}>
                {card.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
