import { type RefObject } from 'react';
import { type FlatList } from 'react-native';

import { type CardRecord } from '@/db/cards';
import { type TransactionRecord } from '@/db/transactions';

export interface CardCarouselProps {
  cards: CardRecord[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  flatListRef: RefObject<FlatList | null>;
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
  /** Offered only when there is another account to move money to. */
  onTransfer?: () => void;
}

// Carousel geometry: the next item peeks in from the right edge so the
// "add card" tile at the end is discoverable without swiping.
export const CAROUSEL_SIDE_PADDING = 16;
export const CAROUSEL_GAP = 12;
export const CAROUSEL_PEEK = 28;

export const ADD_CARD_LABEL = 'Adicionar conta';
export const ADD_CARD_HINT = 'Cadastre uma nova conta';
export const EMPTY_TRANSACTIONS_MESSAGE = 'As transações desta conta aparecem aqui';
export const SEARCH_LABEL = 'Buscar';

// An account is a place where the money is: a bank, a card, cash.
export const EDIT_ACCOUNT_ACTION = 'Editar conta';
export const TRANSFER_ACTION = 'Transferir';

export const NEW_ACCOUNT_TITLE = 'Nova conta';
export const EDIT_ACCOUNT_TITLE = 'Editar conta';
export const NAME_LABEL = 'Nome';
export const NAME_PLACEHOLDER = 'Ex: Nubank, Carteira, Poupança';
export const NUMBER_LABEL = 'Final do cartão (opcional)';
export const NUMBER_PLACEHOLDER = '0000';
export const STARTING_BALANCE_LABEL = 'Saldo inicial (opcional)';
export const STARTING_BALANCE_PLACEHOLDER = '0,00';
export const COLOR_LABEL = 'Cor';
export const CANCEL_LABEL = 'Cancelar';
export const SAVE_LABEL = 'Salvar';
export const SAVING_LABEL = 'Salvando...';

export const DELETE_ACCOUNT_LABEL = 'Excluir conta';
export const LAST_ACCOUNT_HINT = 'É preciso manter pelo menos uma conta.';
// Shown in the account form before the delete button is even pressed, when the account has data.
const countLabel = (transactions: number, recurrences: number) =>
  `${transactions} ${transactions === 1 ? 'transação' : 'transações'}` +
  (recurrences > 0 ? ` e ${recurrences} ${recurrences === 1 ? 'recorrência' : 'recorrências'}` : '');
export const DELETE_ACCOUNT_WARNING = (transactions: number, recurrences: number) =>
  `Esta conta tem ${countLabel(transactions, recurrences)}. Se você excluí-la, tudo isso será apagado e não dá para recuperar.`;
export const DELETE_ACCOUNT_CONFIRM = (name: string, transactions: number, recurrences: number) => ({
  title: `Excluir a conta ${name}?`,
  message:
    transactions === 0 && recurrences === 0
      ? 'Ela não tem transações.'
      : `Isso apaga também ${transactions} ${transactions === 1 ? 'transação' : 'transações'}` +
        (recurrences > 0 ? ` e ${recurrences} ${recurrences === 1 ? 'recorrência' : 'recorrências'}` : '') +
        ' dessa conta, e os totais de todos os meses mudam. Não dá para desfazer.',
  confirmLabel: 'Excluir',
  destructive: true,
});
export const ACCOUNT_DELETED_TOAST = { type: 'success', title: 'Conta excluída', icon: 'delete-outline' } as const;

// The credit card of an account: when its invoice closes and falls due.
export const CREDIT_LABEL = 'Tem cartão de crédito';
export const CREDIT_HINT = 'Libera o Crédito nas saídas desta conta e controla a fatura.';
export const CREDIT_LIMIT_LABEL = 'Limite (opcional)';
export const CREDIT_LIMIT_PLACEHOLDER = '0,00';
export const CREDIT_CLOSING_LABEL = 'Fecha no dia';
export const CREDIT_DUE_LABEL = 'Vence no dia';
export const CREDIT_DAYS_HINT = (closing: number, due: number) =>
  `Compras até o dia ${closing} entram na fatura que fecha nesse dia e vence no dia ${due}${
    due <= closing ? ' do mês seguinte' : ''
  }. Depois do fechamento, vão para a fatura seguinte.`;
export const DEFAULT_CLOSING_DAY = 5;
export const DEFAULT_DUE_DAY = 12;
export const MIN_CARD_DAY = 1;
export const MAX_CARD_DAY = 31;

// Errors of the account dialog and of deleting one.
export const SAVE_FAILED_MESSAGE = 'Não foi possível salvar a conta.';
export const INVALID_BALANCE_MESSAGE = 'Informe um saldo inicial válido.';
export const INVALID_LIMIT_MESSAGE = 'Informe um limite válido.';
export const DELETE_FAILED_TITLE = 'Não foi possível excluir a conta';
