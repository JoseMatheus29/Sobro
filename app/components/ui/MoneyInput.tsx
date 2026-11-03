import React from 'react';
import { TextInput } from 'react-native';

import { formatMoneyText, maskMoney } from '@/utils/money';
import { type MoneyInputProps } from '@/types/components/ui/moneyInput-type';

// A field for an amount of money (see utils/money.ts for why it is not a plain number keyboard): the keyboard has
// digits only, they fill in from the right ("15050" shows 150,50) and the comma and the thousands are always there.
// `value` and `onChangeText` are the canonical text ("1234,50"; "" for nothing), which `parseMoneyText` reads. Every
// other prop (placeholder, className, style, editable…) goes to the TextInput.
export default function MoneyInput({ value, onChangeText, allowNegative = false, ...rest }: MoneyInputProps) {
  return (
    <TextInput
      {...rest}
      value={formatMoneyText(value)}
      onChangeText={(typed) => onChangeText(maskMoney(typed, allowNegative))}
      // The sign needs the key that has it; otherwise digits only, which no language filters out.
      keyboardType={allowNegative ? 'numeric' : 'number-pad'}
    />
  );
}
