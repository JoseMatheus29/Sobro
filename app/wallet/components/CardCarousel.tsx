import React from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Card } from '../../components/card';
import { type CardRecord } from '@/db/cards';

interface CardCarouselProps {
  cards: CardRecord[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  flatListRef: React.RefObject<FlatList>;
  cardWidth: number;
}

export default function CardCarousel({
  cards, activeIndex, setActiveIndex, flatListRef, cardWidth
}: CardCarouselProps) {
  const handleCardChange = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveIndex(index);
  };

  return (
    <View className="mb-3">
      <FlatList
        ref={flatListRef}
        data={cards}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
        ItemSeparatorComponent={() => <View className="w-0" />}
        onMomentumScrollEnd={handleCardChange}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <Card
              cardName={item.name}
              cardNumber={`****${item.number}`}
              expensesAmount={item.balance}
              backgroundColor={item.color}
              lightColor={item.lightColor}
            />
          </View>
        )}
      />

      {/* Dots indicadores */}
      <View className="flex-row justify-center gap-1.5 mt-3.5">
        {cards.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: i, animated: true });
              setActiveIndex(i);
            }}
            className={`h-1.5 rounded-full ${i === activeIndex ? 'w-5 bg-[#3161B2]' : 'w-1.5 bg-[#CBD5E0]'}`}
          />
        ))}
      </View>
    </View>
  );
}
