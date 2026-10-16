import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { notifyDataChanged } from '@/db/events';
import { deleteTransaction, type TransactionRecord } from '@/db/transactions';
import { errorToast } from '@/utils/apiErrors';
import { formatLongDate, formatMoney } from '@/utils/format';
import { monthKeyWithYear } from '@/utils/month';
import ArrowBack from '@/app/components/arrowBack';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import {
  INVOICE_PAYMENT_DATE_LABEL,
  INVOICE_PAYMENT_DELETE_CONFIRM,
  INVOICE_PAYMENT_DELETE_FAILED_TITLE,
  INVOICE_PAYMENT_DELETE_LABEL,
  INVOICE_PAYMENT_DELETED_TOAST,
  INVOICE_PAYMENT_FROM_LABEL,
  INVOICE_PAYMENT_HINT,
  INVOICE_PAYMENT_INVOICE_LABEL,
  INVOICE_PAYMENT_TITLE,
} from '@/types/detailsSpend/detailsSpend-type';
import { tint } from '@/utils/color';

// What the payment of a credit card invoice looks like in the details. It has nothing to edit, because the invoice it
// pays and the balance it took are tied to it: it is deleted (the invoice goes back to being open) and made again.
export default function InvoicePaymentDetails({ transaction }: { transaction: TransactionRecord }) {
  const colors = useColors();
  const router = useRouter();
  const { confirm, showToast } = useFeedback();

  const handleDelete = async () => {
    if (!(await confirm(INVOICE_PAYMENT_DELETE_CONFIRM))) return;
    try {
      await deleteTransaction(transaction.id);
    } catch (error) {
      showToast(errorToast(error, INVOICE_PAYMENT_DELETE_FAILED_TITLE));
      return;
    }
    notifyDataChanged();
    showToast(INVOICE_PAYMENT_DELETED_TOAST);
    router.back();
  };

  const rows = [
    {
      label: INVOICE_PAYMENT_INVOICE_LABEL,
      value: transaction.invoiceMonth ? monthKeyWithYear(transaction.invoiceMonth) : '—',
      icon: 'receipt-long',
    },
    { label: INVOICE_PAYMENT_FROM_LABEL, value: transaction.cardName, icon: 'north-east' },
    { label: INVOICE_PAYMENT_DATE_LABEL, value: formatLongDate(transaction.occurredAt), icon: 'event' },
  ];

  return (
    <View className="flex-1 bg-canvas">
      <ScreenHeader title={INVOICE_PAYMENT_TITLE} leftComponent={<ArrowBack />}>
        <View className="items-center">
          <View className="w-14 h-14 rounded-[18px] bg-headerInk/20 items-center justify-center">
            <Icon name="credit-score" size={28} color={colors.headerInk} />
          </View>
          <Text className="text-4xl font-extrabold text-headerInk tracking-tight mt-3">
            {formatMoney(Math.abs(transaction.amount))}
          </Text>
        </View>
      </ScreenHeader>

      <ScrollView className="flex-1 -mt-7" contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="bg-card rounded-[20px] border border-surface px-4 shadow-sm shadow-black/5 elevation-2">
          {rows.map((row, i) => (
            <View key={row.label} className={`flex-row items-center gap-3 py-3.5 ${i < rows.length - 1 ? 'border-b border-line' : ''}`}>
              <View className="w-10 h-10 rounded-[14px] bg-surface items-center justify-center">
                <Icon name={row.icon} size={20} color={colors.primary.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">{row.label}</Text>
                <Text className="text-base font-medium text-ink">{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-xs text-muted text-center mt-3 px-2">{INVOICE_PAYMENT_HINT}</Text>

        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.8}
          className="h-[52px] mt-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={{ backgroundColor: tint(colors.expense) }}
        >
          <Icon name="delete-outline" size={20} color={colors.expense} />
          <Text className="text-[15px] font-bold text-expense">{INVOICE_PAYMENT_DELETE_LABEL}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
