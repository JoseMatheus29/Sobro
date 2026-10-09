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
    <View>
      <Text className="text-[13.5px] font-semibold text-ink mb-3">Conta</Text>
      <View className="flex-row flex-wrap gap-2">
        {cards.map((card) => {
          const active = selectedCardId === card.id;
          return (
            <TouchableOpacity
              key={card.id}
              onPress={() => setSelectedCardId(card.id)}
              activeOpacity={0.8}
              className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl ${active ? '' : 'bg-surface'}`}
              style={active ? { backgroundColor: `${card.color}1F` } : undefined}
            >
              <Icon name="credit-card" size={15} color={active ? card.color : '#718096'} />
              <Text className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`} style={{ color: active ? card.color : '#718096' }}>
                {card.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
