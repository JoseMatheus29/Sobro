import React, { useState, useRef } from 'react';
import { View, FlatList, Dimensions, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import ScreenHeader from '../components/ui/ScreenHeader';
import TransactionList from '../components/ui/TransactionList';
import CardCarousel from './components/CardCarousel';
import WalletSummary from './components/WalletSummary';
import CardFormModal from './components/CardFormModal';
import { useCards, useTransactions } from '@/db/hooks';
import { type CardRecord } from '@/db/cards';
import { formatShortDate } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;

export default function WalletScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<CardRecord | null>(null);

  const { cards, refetch: refetchCards } = useCards();
  const activeCard = cards[activeIndex];
  const { transactions, refetch: refetchTransactions } = useTransactions({ cardId: activeCard?.id });

  if (!activeCard) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  const displayTransactions = transactions.map((t) => ({
    id: t.id,
    name: t.name,
    date: formatShortDate(t.occurredAt),
    amount: t.amount,
    category: t.categoryName,
    categoryIcon: t.categoryIcon,
    type: t.type,
  }));

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <ScreenHeader
        title="Carteira"
        gradientColors={['#254E8F', '#3161B2', '#4A74BB']}
        rightComponent={
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
            onPress={() => {
              setEditingCard(null);
              setModalVisible(true);
            }}
          >
            <Icon name="add" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1 -mt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <CardCarousel
          cards={cards}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          flatListRef={flatListRef}
          cardWidth={CARD_WIDTH}
        />

        <WalletSummary
          activeCard={activeCard}
          transactions={transactions}
          onEditCard={() => {
            setEditingCard(activeCard);
            setModalVisible(true);
          }}
        />

        <TransactionList
          title="Transações"
          actionLabel="Filtrar"
          transactions={displayTransactions}
          onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
        />
      </ScrollView>

      <CardFormModal
        visible={modalVisible}
        initialCard={editingCard}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          refetchCards();
          refetchTransactions();
        }}
      />

      <SideBar />
    </View>
  );
}
