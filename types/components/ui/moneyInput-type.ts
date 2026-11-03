import { type TextInputProps } from 'react-native';

export interface MoneyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'inputMode'> {
  /** The amount as canonical text: "1234,50", "-80,00", or "" for nothing typed (see utils/money.ts). */
  value: string;
  onChangeText: (value: string) => void;
  /** An amount that can be below zero (the starting balance of an account): offers the key with the sign. */
  allowNegative?: boolean;
}
