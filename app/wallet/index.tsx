import React, { useState, useRef } from 'react';
import { View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '@/app/components/sidebar';
import AddTransactionFab from '@/app/components/AddTransactionFab';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import MonthPill from '@/app/components/month/MonthPill';
import { useSelectedMonth } from '@/app/components/month/MonthProvider';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import LoadError from '@/app/components/ui/LoadError';
import LoadingBlock from '@/app/components/ui/LoadingBlock';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import TransactionList from '@/app/components/ui/TransactionList';
import CardCarousel from '@/app/wallet/components/CardCarousel';
import WalletSummary from '@/app/wallet/components/WalletSummary';
import CardFormModal from '@/app/wallet/components/CardFormModal';
import GoalsSection from '@/app/wallet/components/GoalsSection';
import InvoiceCard from '@/app/wallet/components/InvoiceCard';
import GoalFormModal from '@/app/components/GoalFormModal';
import { useColors } from '@/hooks/useColors';
import { useCards, useGoals, useTransactions } from '@/db/hooks';
import { deleteCard, getCardUsage, type CardRecord } from '@/db/cards';
import { notifyDataChanged } from '@/db/events';
import { refreshReminders } from '@/db/reminders';
import { errorToast } from '@/utils/apiErrors';
import { formatShortDate } from '@/utils/format';
import { monthNameOf } from '@/utils/month';
import { recurrenceBadge } from '@/utils/recurrence';
import { isMoneyMove } from '@/utils/transfer';
import { invoiceTagOf } from '@/utils/invoiceTag';
import {
  ACCOUNT_DELETED_TOAST,
  CAROUSEL_GAP,
  CAROUSEL_PEEK,
  CAROUSEL_SIDE_PADDING,
  DELETE_ACCOUNT_CONFIRM,
  DELETE_FAILED_TITLE,
  EMPTY_TRANSACTIONS_MESSAGE,
  SEARCH_LABEL,
} from '@/types/wallet/wallet-type';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - CAROUSEL_SIDE_PADDING - CAROUSEL_PEEK - CAROUSEL_GAP;

export default function WalletScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<CardRecord | null>(null);
  const [goalFormVisible, setGoalFormVisible] = useState(false);

  const { confirm, showToast } = useFeedback();
  const { month } = useSelectedMonth();
  const { cards, loading: loadingCards, error: cardsError, refetch: refetchCards } = useCards();
  const { goals, loading: loadingGoals, error: goalsError, refetch: refetchGoals } = useGoals();
  // The carousel's last page is the "add card" tile; while it is focused the
  // summary and transactions keep showing the last card.
  const activeCard: CardRecord | undefined = cards[Math.min(activeIndex, cards.length - 1)];
  const {
    transactions,
    loading: loadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions({ cardId: activeCard?.id, month });

  // Deleting an account takes its transactions and recurrences with it, so the person is told how many.
  const handleDeleteCard = async (card: CardRecord) => {
    setModalVisible(false);
    try {
      const usage = await getCardUsage(card.id);
      if (!(await confirm(DELETE_ACCOUNT_CONFIRM(card.name, usage.transactions, usage.recurrences)))) return;

      await deleteCard(card.id);
    } catch (error) {
      showToast(errorToast(error, DELETE_FAILED_TITLE));
      return;
    }
    setActiveIndex(0);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    notifyDataChanged();
    await refreshReminders();
    showToast(ACCOUNT_DELETED_TOAST);
  };

  // Without the accounts there is nothing to show: say why, with a way to try again.
  if (cardsError) return <LoadError fill error={cardsError} onRetry={() => refetchCards()} />;

  if (loadingCards && cards.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
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
    categoryColor: t.categoryColor,
    type: t.type,
    badge: t.recurrence ? recurrenceBadge(t.recurrence) : undefined,
    planned: t.planned,
    transfer: isMoneyMove(t),
    // The invoice a purchase on credit went into.
    tag: invoiceTagOf(t, cards),
  }));

  return (
    <View className="flex-1 bg-canvas">
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll>
        <ScreenHeader
          title="Carteira"
        >
          <View className="items-center">
            <MonthPill />
          </View>
        </ScreenHeader>

        <View className="-mt-7">
          <CardCarousel
            cards={cards}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            flatListRef={flatListRef}
            cardWidth={CARD_WIDTH}
            onAddCard={() => {
              setEditingCard(null);
              setModalVisible(true);
            }}
          />

          {activeCard && (
            <WalletSummary
              activeCard={activeCard}
              transactions={transactions}
              onTransfer={
                cards.length > 1
                  ? () => router.push({ pathname: '/transfer', params: { from: String(activeCard.id) } })
                  : undefined
              }
              onEditCard={() => {
                setEditingCard(activeCard);
                setModalVisible(true);
              }}
            />
          )}

          {activeCard?.credit && (
            <InvoiceCard
              card={activeCard}
              onOpen={(invoiceMonth) =>
                router.push({ pathname: '/invoice/[id]', params: { id: String(activeCard.id), month: invoiceMonth } } as any)
              }
              onPay={(invoiceMonth) =>
                router.push({ pathname: '/payInvoice/[id]', params: { id: String(activeCard.id), month: invoiceMonth } } as any)
              }
            />
          )}

          {goalsError ? (
            <View className="mx-4 mb-7 bg-card rounded-[20px]">
              <LoadError error={goalsError} onRetry={() => refetchGoals()} />
            </View>
          ) : loadingGoals ? null : (
            // Not drawn while they load: an empty list would offer to create the first one when there already are some.
            <GoalsSection
              goals={goals}
              accountBalances={cards.map((c) => c.balance)}
              onNew={() => setGoalFormVisible(true)}
              onOpen={(id) => router.push({ pathname: '/goal/[id]', params: { id: String(id) } })}
            />
          )}

          {transactionsError ? (
            <LoadError error={transactionsError} onRetry={() => refetchTransactions()} />
          ) : loadingTransactions ? (
            <LoadingBlock />
          ) : (
            <TransactionList
              title={`Transações de ${monthNameOf(month)}`}
              actionLabel={SEARCH_LABEL}
              onActionPress={() => router.push('/search')}
              transactions={displayTransactions}
              emptyMessage={EMPTY_TRANSACTIONS_MESSAGE}
              onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
            />
          )}
        </View>
      </ScreenScroll>

      <CardFormModal
        visible={modalVisible}
        initialCard={editingCard}
        canDelete={cards.length > 1}
        onDelete={handleDeleteCard}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          refetchCards();
          refetchTransactions();
        }}
      />

      <GoalFormModal visible={goalFormVisible} onClose={() => setGoalFormVisible(false)} onSaved={() => setGoalFormVisible(false)} />

      <SideBar />
      <AddTransactionFab />
    </View>
  );
}
