import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DatePicker from '@/app/components/ui/DatePicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import EmptyState from '@/app/components/ui/EmptyState';
import GradientButton from '@/app/components/ui/GradientButton';
import LoadError from '@/app/components/ui/LoadError';
import LoadingBlock from '@/app/components/ui/LoadingBlock';
import { notifyDataChanged } from '@/db/events';
import { useCards, useInvoice } from '@/db/hooks';
import { payInvoice } from '@/db/transactions';
import { useColors } from '@/hooks/useColors';
import { useSaveKey } from '@/hooks/useSaveKey';
import { NO_CREDIT_MESSAGE } from '@/types/invoice/invoice-type';
import {
  AMOUNT_LABEL,
  AMOUNT_PLACEHOLDER,
  BALANCE_AFTER_LABEL,
  DATE_LABEL,
  FROM_LABEL,
  FULL_LABEL,
  HINT,
  INVALID_AMOUNT_TOAST,
  NOTHING_TO_PAY,
  OTHER_LABEL,
  PAID_TOAST,
  PAY_FAILED_TITLE,
  PAY_TITLE,
  SUBMIT_LABEL,
  TOO_MUCH_TOAST,
} from '@/types/payInvoice/payInvoice-type';
import { KEYBOARD_AVOIDING_BEHAVIOR } from '@/types/components/ui/keyboard-type';
import { CLOSE_LABEL, SHEET_DIM_COLOR, SHEET_TOP_GAP, toggleThumbStyle } from '@/types/registrationSpent/registrationSpent-type';
import { calendarDayAtNoonUtc, roundAmount } from '@/utils/apiInput';
import { errorToast } from '@/utils/apiErrors';
import { formatMoney } from '@/utils/format';
import { INVOICE_EPSILON } from '@/utils/invoice-type';
import { monthNameOf } from '@/utils/month';

// A sheet to pay (all or part of) an invoice with the balance of the account that has the card. It is not a
// spending: the purchases were counted on the day they were made, so this only moves the balance.
export default function PayInvoiceSheet() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveKey = useSaveKey();
  const { showToast } = useFeedback();
  const { id, month } = useLocalSearchParams<{ id: string; month: string }>();

  const { cards, loading: loadingCards, error: cardsError, refetch: refetchCards } = useCards();
  const card = cards.find((c) => c.id === Number(id)) ?? null;
  const { invoice, loading: loadingInvoice, error: invoiceError, refetch: refetchInvoice } = useInvoice(card, month ?? null);

  const [full, setFull] = useState(true);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // "Valor total" follows what is left; "Outro valor" is typed.
  const remaining = invoice?.remaining ?? 0;
  useEffect(() => {
    if (full) setAmount(remaining > 0 ? String(roundAmount(remaining)).replace('.', ',') : '');
  }, [full, remaining]);

  const value = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(value) && value > 0;
  const canSubmit = valid && invoice !== null && remaining > INVOICE_EPSILON && !saving;
  const balanceAfter = card ? card.balance - (valid ? value : 0) : 0;

  const handleSubmit = async () => {
    if (!card || !invoice) return;
    if (!valid) return showToast(INVALID_AMOUNT_TOAST);
    if (value > remaining + INVOICE_EPSILON) return showToast(TOO_MUCH_TOAST(formatMoney(remaining)));

    const input = { month: invoice.month, amount: roundAmount(value), occurredAt: calendarDayAtNoonUtc(date) };
    setSaving(true);
    try {
      // The same key on a retry of the same form, so a lost answer never pays twice.
      await payInvoice(card.id, input, saveKey.keyFor({ cardId: card.id, ...input }));
      saveKey.clear();
    } catch (error) {
      showToast(errorToast(error, PAY_FAILED_TITLE));
      setSaving(false);
      return;
    }
    notifyDataChanged();
    showToast(PAID_TOAST(formatMoney(value).replace('R$ ', ''), monthNameOf(invoice.month)));
    router.back();
  };

  const body = () => {
    if (cardsError) return <LoadError error={cardsError} onRetry={() => refetchCards()} />;
    if (invoiceError && !invoice) return <LoadError error={invoiceError} onRetry={() => refetchInvoice()} />;
    if ((loadingCards && !card) || (loadingInvoice && !invoice)) return <LoadingBlock />;
    if (!card || !card.credit) {
      return (
        <View className="px-5 pt-4">
          <EmptyState icon="credit-card" message={NO_CREDIT_MESSAGE} />
        </View>
      );
    }
    if (!invoice || remaining <= INVOICE_EPSILON) {
      return (
        <View className="px-5 pt-4">
          <EmptyState icon="check-circle-outline" message={NOTHING_TO_PAY} />
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerClassName="px-5 pt-3 gap-3"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-card rounded-[20px] px-4 py-3">
          <Text className="text-xs text-muted">{AMOUNT_LABEL}</Text>
          <View className="flex-row items-center">
            <Text className="text-[28px] font-extrabold text-ink mr-2">R$</Text>
            <TextInput
              className="flex-1 text-[28px] font-extrabold text-ink py-1"
              placeholder={AMOUNT_PLACEHOLDER}
              placeholderTextColor={colors.subtle}
              value={amount}
              onChangeText={(text) => {
                setFull(false);
                setAmount(text);
              }}
              keyboardType="numeric"
              editable={!full}
            />
          </View>
          <View className="flex-row bg-surface rounded-2xl p-1 gap-1 mt-2">
            {[
              { label: FULL_LABEL, active: full, onPress: () => setFull(true) },
              {
                label: OTHER_LABEL,
                active: !full,
                onPress: () => {
                  setFull(false);
                  setAmount('');
                },
              },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                onPress={option.onPress}
                activeOpacity={0.8}
                accessibilityState={{ selected: option.active }}
                className="flex-1 h-10 rounded-xl items-center justify-center"
                style={option.active ? toggleThumbStyle(colors) : undefined}
              >
                <Text
                  className="text-sm"
                  style={{ color: option.active ? colors.primary.DEFAULT : colors.muted, fontWeight: option.active ? '700' : '500' }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="h-[68px] bg-card rounded-[20px] px-4 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${card.color}1F` }}>
            <Icon name="account-balance-wallet" size={20} color={card.color} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted">{FROM_LABEL}</Text>
            <Text className="text-base font-medium text-ink">{card.name}</Text>
          </View>
          <Text className="text-xs text-muted">{formatMoney(card.balance)}</Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          activeOpacity={0.8}
          className="h-16 bg-card rounded-[20px] px-4 flex-row items-center gap-3"
        >
          <View className="w-10 h-10 rounded-[14px] bg-surface items-center justify-center">
            <Icon name="event" size={20} color={colors.primary.DEFAULT} />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-muted">{DATE_LABEL}</Text>
            <Text className="text-base font-medium text-ink">
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </TouchableOpacity>

        <View className="flex-row justify-between items-center bg-card rounded-2xl px-4 py-3">
          <Text className="text-[13px] text-muted">{BALANCE_AFTER_LABEL}</Text>
          <Text className="text-[13px] font-bold" style={{ color: balanceAfter < 0 ? colors.expense : colors.ink }}>
            {formatMoney(balanceAfter)}
          </Text>
        </View>

        <Text className="text-xs text-muted text-center px-2">{HINT}</Text>

        <View pointerEvents={canSubmit ? 'auto' : 'none'}>
          <GradientButton
            title={SUBMIT_LABEL(valid ? formatMoney(value).replace('R$ ', '') : '')}
            onPress={handleSubmit}
            colors={canSubmit ? undefined : colors.disabledGradient}
            shadowColor={canSubmit ? undefined : colors.disabledGradient[0]}
          />
        </View>
      </ScrollView>
    );
  };

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable accessibilityLabel={CLOSE_LABEL} onPress={() => router.back()} style={{ height: insets.top + SHEET_TOP_GAP }} />
      <KeyboardAvoidingView
        className="flex-1 bg-canvas rounded-t-[28px] overflow-hidden"
        behavior={KEYBOARD_AVOIDING_BEHAVIOR}
      >
        <View className="items-center pt-2.5">
          <View className="w-10 h-1 rounded-full bg-surface-dark" />
        </View>
        <View className="h-14 items-center justify-center">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel={CLOSE_LABEL}
            className="absolute left-3 w-11 h-11 rounded-[14px] bg-surface items-center justify-center"
          >
            <Icon name="close" size={22} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink">{PAY_TITLE}</Text>
        </View>

        {body()}

        {showPicker && (
          <DatePicker
            value={date}
            maximumDate={new Date()}
            onChange={(selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
