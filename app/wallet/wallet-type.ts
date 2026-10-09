import { type RefObject } from 'react';
import { type FlatList } from 'react-native';

import { type CardRecord } from '@/db/cards';
import { type TransactionRecord } from '@/db/transactions';

export interface CardCarouselProps {
  cards: CardRecord[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  flatListRef: RefObject<FlatList>;
  cardWidth: number;
  onAddCard: () => void;
}

export interface AddCardTileProps {
  width: number;
  onPress: () => void;
}

export interface WalletSummaryProps {
  activeCard: CardRecord;
  transactions: TransactionRecord[];
  onEditCard: () => void;
}

// Carousel geometry: the next item peeks in from the right edge so the
// "add card" tile at the end is discoverable without swiping.
export const CAROUSEL_SIDE_PADDING = 16;
export const CAROUSEL_GAP = 12;
export const CAROUSEL_PEEK = 28;

export const ADD_CARD_LABEL = 'Adicionar cartão';
export const ADD_CARD_HINT = 'Cadastre uma nova conta';
export const EMPTY_TRANSACTIONS_MESSAGE = 'As transações desta conta aparecem aqui';
