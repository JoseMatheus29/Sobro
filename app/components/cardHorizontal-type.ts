export interface CardHorizontalProps {
  name?: string;
  date?: string;
  amount?: number;
  category?: string;
  icon?: string;
  type?: 'income' | 'expense';
  /** Category color for the icon and its soft background; defaults to the green or blue of the type. */
  iconColor?: string;
  onPress?: () => void;
}
