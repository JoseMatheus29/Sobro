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
import { closesOn, dueOn, formatCalendarDay, invoiceMonthOf, localDay } from '@/utils/invoice';
import { type InvoiceRules } from '@/utils/invoice-type';
import { monthNameOf } from '@/utils/month';

interface PaymentSectionProps {
  method: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** The days of the card of the account picked: only an account with a credit card asks how it was paid. */
  rules: InvoiceRules;
  /** The day of the purchase, which decides the invoice it goes into. */
  date: Date;
  /** Paid in installments: each one falls in a different invoice. */
  installments: boolean;
}

// "Como pagou" of a new expense: how it was paid and, for credit, which invoice it goes into.
export default function PaymentSection({ method, onChange, rules, date, installments }: PaymentSectionProps) {
  const invoice = invoiceMonthOf(localDay(date), rules);
  const hint =
    method !== 'credit'
      ? PAYMENT_BALANCE_HINT
      : installments
        ? PAYMENT_CREDIT_INSTALLMENTS_HINT(monthNameOf(invoice))
        : PAYMENT_CREDIT_HINT(
            monthNameOf(invoice),
            formatCalendarDay(closesOn(invoice, rules)),
            formatCalendarDay(dueOn(invoice, rules))
          );

  return (
    <View>
      <Text className="text-[13px] font-bold text-muted mt-1 ml-1 mb-2">{PAYMENT_TITLE}</Text>
      <PaymentMethodToggle value={method} onChange={onChange} />
      <Text className="text-xs leading-[17px] text-muted mt-2 ml-1">{hint}</Text>
    </View>
  );
}
