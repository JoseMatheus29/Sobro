import { ViewStyle } from 'react-native';

export interface CardValues {
  cardName: string;
  cardNumber: string;
  expensesAmount: number;
  backgroundColor?: string;
  lightColor?: string;
  style?: ViewStyle;
  isSelected?: boolean;
}
