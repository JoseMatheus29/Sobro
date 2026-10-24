import React from 'react';
import { Text, View } from 'react-native';

import PaymentMethodToggle from '@/app/components/ui/PaymentMethodToggle';
import { type PaymentMethod } from '@/db/transactions';
import {
  PAYMENT_BALANCE_HINT,
  PAYMENT_CREDIT_HINT,
  PAYMENT_CREDIT_INSTALLMENTS_HINT,
  PAYMENT_TITLE,
} from '@/types/components/ui/payment-type';
import { closesOn, dueOn, formatCalendarDay, invoiceMonthOf, invoiceName, localDay } from '@/utils/invoice';
import { type InvoiceRules } from '@/utils/invoice-type';

interface PaymentSectionProps {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** The days of the card of the account picked; null when it has none, and then there is no credit. */
  rules: InvoiceRules | null;
  /** The day of the purchase, which decides the invoice it goes into. */
  date: Date;
  /** Paid in installments: each one falls in a different invoice. */
  installments: boolean;
}

// "Como pagou" of a new expense: Pix or debit leave the balance at once; credit (only on an account with a card) goes
// into an invoice, and the hint says which.
export default function PaymentSection({ method, onChange, rules, date, installments }: PaymentSectionProps) {
  let hint = PAYMENT_BALANCE_HINT;
  if (method === 'credit' && rules) {
    const invoice = invoiceMonthOf(localDay(date), rules);
    hint = installments
      ? PAYMENT_CREDIT_INSTALLMENTS_HINT
      : PAYMENT_CREDIT_HINT(
          invoiceName(invoice, rules),
          formatCalendarDay(closesOn(invoice, rules)),
          formatCalendarDay(dueOn(invoice, rules))
        );
  }

  return (
    <View>
      <Text className="text-[13px] font-bold text-muted mt-1 ml-1 mb-2">{PAYMENT_TITLE}</Text>
      <PaymentMethodToggle value={method} onChange={onChange} creditAvailable={rules !== null} />
      <Text className="text-xs leading-[17px] text-muted mt-2 ml-1">{hint}</Text>
    </View>
  );
}
