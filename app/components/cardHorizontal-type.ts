export interface CardHorizontalProps {
  name?: string;
  date?: string;
  amount?: number;
  category?: string;
  icon?: string;
  type?: 'income' | 'expense';
  onPress?: () => void;
}
