import { type ReactNode } from 'react';

import { type TransactionRecord } from '@/db/transactions';
import { type Insight } from '@/utils/insightRules-type';
import { type MonthSummary } from '@/utils/summary-type';

export interface DashboardHeaderProps {
  userName?: string;
}

export interface FlowSectionProps {
  summary: MonthSummary;
  /** "outubro 2026": the month the figures belong to. */
  monthLabel: string;
}

export interface FlowCardProps {
  icon: string;
  color: string;
  label: string;
  value: string;
  /** Small pill next to the icon. */
  badge?: string;
  /** Color of the pill; defaults to `color`. */
  badgeColor?: string;
  children?: ReactNode;
}

export interface InsightHighlightProps {
  /** The most relevant insight, the one shown on the card. */
  insight: Insight;
  /** How many there are in total, to hint that the card opens a list. */
  count: number;
  onPress: () => void;
}

export interface RecentTransactionsProps {
  transactions: TransactionRecord[];
  onSeeAll: () => void;
  onPressItem: (id: number) => void;
}

export const GREETING = 'Olá';

export const FLOW_TITLE = 'Fluxo de Caixa';
export const FLOW_INCOME_LABEL = 'Entradas';
export const FLOW_EXPENSE_LABEL = 'Saídas';
export const FLOW_COMPARED_LABEL = 'vs. mês anterior';
export const FLOW_THIS_MONTH_LABEL = 'neste mês';
export const FLOW_USE_LABEL = (percent: number) => `${percent}% uso`;
export const FLOW_NO_INCOME_LABEL = 'Sem entradas no mês';
// A bar with anything in it never shrinks below this share, so a small spend is still visible.
export const FLOW_BAR_MIN_PERCENT = 3;

export const INSIGHT_COUNT_LABEL =(count: number) =>
  count === 1 ? '1 dica para você' : `${count} dicas para você`;

export const RECENT_TITLE ='Últimas transações';
export const RECENT_ACTION_LABEL = 'Ver todas';
export const EMPTY_RECENT_MESSAGE = 'Suas transações aparecem aqui';

// How far the summary card is pulled up over the blue header.
export const SUMMARY_OVERLAP = 28;
// Fixed space between the blocks of the screen.
export const SECTION_GAP = 28;

// The list shows as many rows as fit above the floating button (never fewer than the minimum),
// so a tall screen is filled with content rather than with empty space. The heights below mirror
// RecentTransactions: title row (24 + 12 margin), a row (py-3.5 around a 40px icon, plus its divider)
// and the list's own border.
export const RECENT_MIN = 3;
export const RECENT_MAX = 8;
export const RECENT_TITLE_HEIGHT = 36;
export const RECENT_ROW_HEIGHT = 69;
export const RECENT_LIST_BORDER = 2;
