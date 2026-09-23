import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Card from '../../components/card';
import { type CardRecord } from '@/db/cards';

interface CardsSectionProps {
  cards: CardRecord[];
  onSeeAll: () => void;
}

export default function CardsSection({ cards, onSeeAll }: CardsSectionProps) {
  const primaryCard = cards[0];

  return (
    <View className="mb-7">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[17px] font-bold text-[#1A2B4A]">Meus Cartões</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text className="text-[13px] text-[#3161B2] font-semibold">Ver todos</Text>
        </TouchableOpacity>
      </View>
      {primaryCard ? (
        <Card
          cardName={primaryCard.name}
          cardNumber={`****${primaryCard.number}`}
          expensesAmount={primaryCard.balance}
          backgroundColor={primaryCard.color}
          lightColor={primaryCard.lightColor}
        />
      ) : (
        <Text className="text-sm text-[#A0AEC0]">Nenhuma conta cadastrada ainda.</Text>
      )}
    </View>
  );
}
