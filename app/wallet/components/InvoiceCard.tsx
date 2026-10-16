import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import LoadError from '@/app/components/ui/LoadError';
import { type CardRecord } from '@/db/cards';
import { useInvoice, useOpenInvoice } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import {
  CLOSES_AND_DUE,
  CLOSES_TEXT,
  INVOICE_STATUS_LABEL,
  invoiceTitle,
  PAY_ACTION,
  PLANNED_NOTE,
  PREVIOUS_UNPAID,
  REMAINING_TEXT,
  VIEW_ACTION,
} from '@/types/invoice/invoice-type';
import { tint } from '@/utils/color';
import { formatMoney } from '@/utils/format';
import { daysBetween, formatCalendarDay, todayKey } from '@/utils/invoice';
import { type InvoiceStatus } from '@/utils/invoice-type';
import { addMonths, monthNameOf } from '@/utils/month';
import { type Palette } from '@/constants/palette';

interface InvoiceCardProps {
  /** An account with a credit card. */
  card: CardRecord;
  /** Opens the invoice of that month ('YYYY-MM'). */
  onOpen: (month: string) => void;
  onPay: (month: string) => void;
}

const statusColor = (status: InvoiceStatus, colors: Palette) =>
  status === 'paid'
    ? colors.income
    : status === 'overdue'
      ? colors.expense
      : status === 'closed'
        ? colors.warning
        : colors.primary.DEFAULT;

// The invoice of the credit card that is taking purchases, on the account summary of the Carteira. A closed one
// that is still waiting for its payment comes under it: that is the one that must not be forgotten.
export default function InvoiceCard({ card, onOpen, onPay }: InvoiceCardProps) {
  const colors = useColors();
  const { month, invoice, loading, error, refetch } = useOpenInvoice(card);
  const previousMonth = month ? addMonths(month, -1) : null;
  const { invoice: previous } = useInvoice(card, previousMonth);

  if (!month) return null;
  if (error && !invoice) {
    return (
      <View className="mx-4 mb-7 bg-card rounded-[20px] border border-surface">
        <LoadError error={error} onRetry={() => refetch()} />
      </View>
    );
  }
  if (!invoice) {
    return (
      <View className="mx-4 mb-7 bg-card rounded-[20px] border border-surface p-5 items-center">
        {loading ? <ActivityIndicator color={colors.primary.DEFAULT} /> : null}
      </View>
    );
  }

  const today = todayKey();
  const color = statusColor(invoice.status, colors);
  const owedBefore = previous && (previous.status === 'closed' || previous.status === 'overdue') && previous.remaining > 0;

  return (
    <View className="mx-4 mb-7 bg-card rounded-[20px] p-5 border border-surface">
      <View className="flex-row items-center justify-between">
        <Text className="text-[15px] font-bold text-ink">{invoiceTitle(monthNameOf(invoice.month))}</Text>
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: tint(color) }}>
          <Text className="text-[11px] font-bold" style={{ color }}>{INVOICE_STATUS_LABEL[invoice.status]}</Text>
        </View>
      </View>

      <Text className="text-[28px] font-extrabold text-ink mt-2">{formatMoney(invoice.total)}</Text>
      <Text className="text-xs text-muted mt-0.5">
        {CLOSES_AND_DUE(formatCalendarDay(invoice.closesOn), formatCalendarDay(invoice.dueOn))}
        {invoice.status === 'open' ? ` · ${CLOSES_TEXT(daysBetween(today, invoice.closesOn))}` : ''}
      </Text>
      {invoice.paid > 0 && invoice.remaining > 0 && (
        <Text className="text-xs font-semibold text-expense mt-1">{REMAINING_TEXT(formatMoney(invoice.remaining))}</Text>
      )}
      {invoice.plannedTotal > 0 && (
        <Text className="text-xs text-subtle mt-1">{PLANNED_NOTE(formatMoney(invoice.plannedTotal))}</Text>
      )}

      <View className="flex-row gap-2.5 mt-4">
        <TouchableOpacity
          onPress={() => onOpen(invoice.month)}
          activeOpacity={0.8}
          className="flex-1 h-11 rounded-[14px] border-[1.5px] border-line bg-canvas flex-row items-center justify-center gap-1.5"
        >
          <Icon name="receipt-long" size={18} color={colors.primary.DEFAULT} />
          <Text className="text-[14px] font-bold text-primary">{VIEW_ACTION}</Text>
        </TouchableOpacity>
        {invoice.remaining > 0 && (
          <TouchableOpacity
            onPress={() => onPay(invoice.month)}
            activeOpacity={0.8}
            className="flex-1 h-11 rounded-[14px] flex-row items-center justify-center gap-1.5"
            style={{ backgroundColor: colors.buttonGradient[0] }}
          >
            <Icon name="credit-score" size={18} color="#FFFFFF" />
            <Text className="text-[14px] font-bold text-white">{PAY_ACTION}</Text>
          </TouchableOpacity>
        )}
      </View>

      {owedBefore && previous && (
        <TouchableOpacity
          onPress={() => onOpen(previous.month)}
          activeOpacity={0.8}
          className="flex-row items-center gap-2.5 mt-4 rounded-[14px] p-3"
          style={{ backgroundColor: tint(previous.status === 'overdue' ? colors.expense : colors.warning) }}
        >
          <Icon
            name="error-outline"
            size={18}
            color={previous.status === 'overdue' ? colors.expense : colors.warning}
          />
          <Text className="flex-1 text-[13px] font-semibold text-ink">
            {PREVIOUS_UNPAID(monthNameOf(previous.month), formatMoney(previous.remaining))}
          </Text>
          <Icon name="chevron-right" size={20} color={colors.subtle} />
        </TouchableOpacity>
      )}
    </View>
  );
}
