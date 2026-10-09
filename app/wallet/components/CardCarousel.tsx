import React from 'react';
import { View, FlatList, TouchableOpacity, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Card } from '../../components/card';
import AddCardTile from './AddCardTile';
import { CAROUSEL_GAP, CAROUSEL_SIDE_PADDING, CardCarouselProps } from '../wallet-type';

export default function CardCarousel({
  cards, activeIndex, setActiveIndex, flatListRef, cardWidth, onAddCard
}: CardCarouselProps) {
  const snapInterval = cardWidth + CAROUSEL_GAP;
  // The "add card" tile is the last page, after every card.
  const pageCount = cards.length + 1;

  const handleCardChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.min(index, pageCount - 1));
  };

  return (
    <View className="mb-6">
      <FlatList
        ref={flatListRef}
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: CAROUSEL_SIDE_PADDING }}
        ItemSeparatorComponent={() => <View style={{ width: CAROUSEL_GAP }} />}
        onMomentumScrollEnd={handleCardChange}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <Card
              cardName={item.name}
              cardNumber={item.number ? `****${item.number}` : ''}
              expensesAmount={item.balance}
              backgroundColor={item.color}
              lightColor={item.lightColor}
            />
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginLeft: cards.length > 0 ? CAROUSEL_GAP : 0 }}>
            <AddCardTile width={cardWidth} onPress={onAddCard} />
          </View>
        }
      />

      {/* Dots indicadores */}
      <View className="flex-row justify-center gap-1.5 mt-4">
        {Array.from({ length: pageCount }, (_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              flatListRef.current?.scrollToOffset({ offset: i * snapInterval, animated: true });
              setActiveIndex(i);
            }}
            className={`h-1.5 rounded-full ${i === activeIndex ? 'w-5 bg-primary' : 'w-1.5 bg-surface-dark'}`}
          />
        ))}
      </View>
    </View>
  );
}
