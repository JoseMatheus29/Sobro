export interface CardHorizontalProps {
  name?: string;
  date?: string;
  amount?: number;
  category?: string;
  icon?: string;
  type?: 'income' | 'expense';
  /** Category color for the icon and its soft background; defaults to the green or blue of the type. */
  iconColor?: string;
  /** Short text next to the name, for what comes from a recurring expense: "4/10" or "Todo mês". */
  badge?: string;
  /** A planned expense of a month that has not started: dashed, muted, and not pressable. */
  planned?: boolean;
  /** A transfer between accounts: neither income nor expense, so the amount is neutral. */
  transfer?: boolean;
  onPress?: () => void;
}

export const PLANNED_LABEL = 'PREVISTO';
