import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';

import ArrowBack from '@/app/components/arrowBack';
import SideBar from '@/app/components/sidebar';
import LoadError from '@/app/components/ui/LoadError';
import LoadingBlock from '@/app/components/ui/LoadingBlock';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import TransactionList from '@/app/components/ui/TransactionList';
import { useCards, useInvoice } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import { SCROLL_PADDING_WITH_SIDEBAR } from '@/types/components/sidebar-type';
import {
  CLOSES_TEXT,
  CYCLE_TEXT,
  DUE_TEXT,
  EMPTY_PURCHASES,
  INVOICE_SCREEN_TITLE,
  INVOICE_STATUS_LABEL,
  invoiceTitle,
  NEXT_MONTH_LABEL,
  NO_CREDIT_MESSAGE,
  NOTHING_TO_PAY_TEXT,
  PAID_TEXT,
  PAY_ACTION,
  PAYMENTS_TITLE,
  PLANNED_NOTE,
  PREVIOUS_MONTH_LABEL,
  PURCHASES_COUNT,
  PURCHASES_TITLE,
  REMAINING_TEXT,
} from '@/types/invoice/invoice-type';
import { tint } from '@/utils/color';
import { formatMoney, formatShortDate } from '@/utils/format';
import { daysBetween, formatCalendarDay, openInvoiceMonth, todayKey } from '@/utils/invoice';
import { INVOICE_MONTHS_AHEAD, type InvoiceStatus } from '@/utils/invoice-type';
import { addMonths, monthKeyWithYear, monthNameOf } from '@/utils/month';
import { recurrenceBadge } from '@/utils/recurrence';
import { type Palette } from '@/constants/palette';
import { type TransactionRecord } from '@/db/transactions';

const statusColor = (status: InvoiceStatus, colors: Palette) =>
  status === 'paid'
    ? colors.income
    : status === 'overdue'
      ? colors.expense
      : status === 'closed'
        ? colors.warning
        : colors.primary.DEFAULT;

const toRow = (t: TransactionRecord, neutral: boolean) => ({
  id: t.id,
  name: t.name,
  date: formatShortDate(t.occurredAt),
  amount: t.amount,
  category: t.categoryName,
  categoryIcon: t.categoryIcon,
  categoryColor: t.categoryColor,
  type: t.type,
  badge: t.recurrence ? recurrenceBadge(t.recurrence) : undefined,
  planned: t.planned,
  transfer: neutral,
});

// The invoice of a credit card, month by month: what was bought in its cycle, what was paid, and the way to pay it.
export default function InvoiceScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id, month: monthParam } = useLocalSearchParams<{ id: string; month?: string }>();

  const { cards, loading: loadingCards, error: cardsError, refetch: refetchCards } = useCards();
  const card = cards.find((c) => c.id === Number(id)) ?? null;
  const openMonth = card?.credit ? openInvoiceMonth(todayKey(), card.credit) : null;

  // The invoice that opened the screen, until the person moves to another one.
  const [picked, setPicked] = useState<string | null>(monthParam ?? null);
  const month = picked ?? openMonth;
  const { invoice, error, refetch } = useInvoice(card, month);

  const header = (
    <ScreenHeader title={INVOICE_SCREEN_TITLE} leftComponent={<ArrowBack />}>
      <View className="items-center">
        {card && <Text className="text-sm text-headerInk/80">{card.name}{card.number ? ` · cartão •••• ${card.number}` : ''}</Text>}
        {month && openMonth && (
          <View className="flex-row items-center gap-1 mt-2">
            <TouchableOpacity
              onPress={() => setPicked(addMonths(month, -1))}
              accessibilityLabel={PREVIOUS_MONTH_LABEL}
              className="w-10 h-10 items-center justify-center"
            >
              <Icon name="chevron-left" size={26} color={colors.headerInk} />
            </TouchableOpacity>
            <Text className="min-w-[150px] text-center text-lg font-bold text-headerInk">{monthKeyWithYear(month)}</Text>
            <TouchableOpacity
              onPress={() => setPicked(addMonths(month, 1))}
              disabled={month >= addMonths(openMonth, INVOICE_MONTHS_AHEAD)}
              accessibilityLabel={NEXT_MONTH_LABEL}
              className="w-10 h-10 items-center justify-center"
              style={{ opacity: month >= addMonths(openMonth, INVOICE_MONTHS_AHEAD) ? 0.3 : 1 }}
            >
              <Icon name="chevron-right" size={26} color={colors.headerInk} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenHeader>
  );

  if (cardsError) return <LoadError fill error={cardsError} onRetry={() => refetchCards()} />;
  if (!card && loadingCards) return <LoadingBlock />;
  if (!card || !card.credit) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-base text-muted text-center">{NO_CREDIT_MESSAGE}</Text>
      </View>
    );
  }

  const today = todayKey();
  const color = invoice ? statusColor(invoice.status, colors) : colors.primary.DEFAULT;

  return (
    <View className="flex-1 bg-canvas">
      <ScreenScroll bottomPadding={SCROLL_PADDING_WITH_SIDEBAR}>
        {header}

        <View className="px-5 -mt-7">
          {error && !invoice ? (
            <LoadError error={error} onRetry={() => refetch()} />
          ) : !invoice ? (
            <LoadingBlock />
          ) : (
            <>
              <View className="bg-card rounded-[24px] p-5 mb-5 shadow-lg shadow-primary/10 elevation-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold tracking-[0.8px] uppercase text-primary-lighter">
                    {invoiceTitle(monthNameOf(invoice.month))}
                  </Text>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: tint(color) }}>
                    <Text className="text-[11px] font-bold" style={{ color }}>{INVOICE_STATUS_LABEL[invoice.status]}</Text>
                  </View>
                </View>

                <Text className="text-4xl font-extrabold text-ink tracking-tight mt-2">{formatMoney(invoice.total)}</Text>
                {invoice.paid > 0 && (
                  <Text className="text-[13px] text-muted mt-1">
                    {PAID_TEXT(formatMoney(invoice.paid))}
                    {invoice.remaining > 0 ? ` · ${REMAINING_TEXT(formatMoney(invoice.remaining))}` : ''}
                  </Text>
                )}
                {invoice.plannedTotal > 0 && (
                  <Text className="text-xs text-subtle mt-1">{PLANNED_NOTE(formatMoney(invoice.plannedTotal))}</Text>
                )}

                <View className="flex-row justify-between mt-5">
                  <Text className="text-xs text-muted">{CYCLE_TEXT(formatCalendarDay(invoice.opensOn), formatCalendarDay(invoice.closesOn))}</Text>
                  <Text className="text-xs font-bold text-ink">
                    {invoice.status === 'open'
                      ? CLOSES_TEXT(daysBetween(today, invoice.closesOn))
                      : DUE_TEXT(formatCalendarDay(invoice.dueOn), daysBetween(today, invoice.dueOn))}
                  </Text>
                </View>
                {invoice.status === 'open' && (
                  <View className="h-1.5 rounded-full bg-surface-dark mt-2 overflow-hidden">
                    <View
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.round(
                          Math.min(
                            1,
                            Math.max(
                              0,
                              (daysBetween(invoice.opensOn, today) + 1) / (daysBetween(invoice.opensOn, invoice.closesOn) + 1)
                            )
                          ) * 100
                        )}%`,
                        backgroundColor: colors.primary.DEFAULT,
                      }}
                    />
                  </View>
                )}

                {invoice.remaining > 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({ pathname: '/payInvoice/[id]', params: { id: String(card.id), month: invoice.month } } as any)
                    }
                    activeOpacity={0.85}
                    className="h-[52px] mt-5 rounded-2xl flex-row items-center justify-center gap-2"
                    style={{ backgroundColor: colors.buttonGradient[0] }}
                  >
                    <Icon name="credit-score" size={20} color="#FFFFFF" />
                    <Text className="text-base font-bold text-white">{PAY_ACTION}</Text>
                  </TouchableOpacity>
                ) : invoice.total > 0 ? null : (
                  <Text className="text-xs text-muted mt-4">{NOTHING_TO_PAY_TEXT}</Text>
                )}
              </View>

              <View className="-mx-4">
                <TransactionList
                  title={PURCHASES_TITLE}
                  actionLabel={PURCHASES_COUNT(invoice.purchases.length)}
                  transactions={invoice.purchases.map((t) => toRow(t, false))}
                  emptyMessage={EMPTY_PURCHASES}
                  onPressItem={(txId) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(txId) } })}
                />
                {invoice.payments.length > 0 && (
                  <View className="mt-4">
                    <TransactionList
                      title={PAYMENTS_TITLE}
                      transactions={invoice.payments.map((t) => toRow(t, true))}
                      onPressItem={(txId) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(txId) } })}
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScreenScroll>

      <SideBar />
    </View>
  );
}
