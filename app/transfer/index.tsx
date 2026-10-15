import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useCards } from '@/db/hooks';
import { notifyDataChanged } from '@/db/events';
import { createTransfer } from '@/db/transactions';
import { useSaveKey } from '@/hooks/useSaveKey';
import { calendarDayAtNoonUtc, roundAmount } from '@/utils/apiInput';
import { errorToast } from '@/utils/apiErrors';
import { formatMoney } from '@/utils/format';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import EmptyState from '@/app/components/ui/EmptyState';
import GradientButton from '@/app/components/ui/GradientButton';
import PickerSheet from '@/app/components/ui/PickerSheet';
import { CLOSE_LABEL, SHEET_DIM_COLOR, SHEET_TOP_GAP } from '@/types/registrationSpent/registrationSpent-type';
import {
  AMOUNT_LABEL,
  AMOUNT_PLACEHOLDER,
  DATE_LABEL,
  DESCRIPTION_LABEL,
  DESCRIPTION_PLACEHOLDER,
  FROM_LABEL,
  FROM_SHEET_TITLE,
  HINT,
  INVALID_AMOUNT_TOAST,
  NEED_TWO_ACCOUNTS,
  SAME_ACCOUNT_TOAST,
  SELECT_LABEL,
  SUBMIT_LABEL,
  SWAP_LABEL,
  TO_LABEL,
  TO_SHEET_TITLE,
  TRANSFER_FAILED_TITLE,
  TRANSFER_TITLE,
  TRANSFERRED_TOAST,
} from '@/types/transfer/transfer-type';

// A sheet to move money from one account to another. It is not an income or an expense: it only
// changes the balance of the two accounts.
export default function TransferSheet() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const saveKey = useSaveKey();
  const { showToast } = useFeedback();
  const { cards } = useCards();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [amount, setAmount] = useState('');
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [sheet, setSheet] = useState<'from' | 'to' | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Starts from the account that was on screen, going to the first other one.
  useEffect(() => {
    if (fromId !== null || cards.length < 2) return;
    const start = cards.find((c) => String(c.id) === from) ?? cards[0];
    setFromId(start.id);
    setToId(cards.find((c) => c.id !== start.id)?.id ?? null);
  }, [cards, from, fromId]);

  const fromCard = cards.find((c) => c.id === fromId) ?? null;
  const toCard = cards.find((c) => c.id === toId) ?? null;
  const value = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(value) && value > 0;
  const canSubmit = valid && fromCard !== null && toCard !== null && !saving;

  const handleSubmit = async () => {
    if (!fromCard || !toCard) return;
    if (!valid) return showToast(INVALID_AMOUNT_TOAST);
    if (fromCard.id === toCard.id) return showToast(SAME_ACCOUNT_TOAST);

    const input = {
      fromCardId: fromCard.id,
      toCardId: toCard.id,
      amount: roundAmount(value),
      description: description.trim() || undefined,
      // The day on the phone's calendar, at noon UTC (see utils/apiInput.ts).
      occurredAt: calendarDayAtNoonUtc(date),
    };
    setSaving(true);
    try {
      // The same key on a retry of the same form, so a lost answer never makes two transfers.
      await createTransfer(input, saveKey.keyFor(input));
      saveKey.clear();
    } catch (error) {
      showToast(errorToast(error, TRANSFER_FAILED_TITLE));
      setSaving(false);
      return;
    }
    notifyDataChanged();
    showToast(TRANSFERRED_TOAST(formatMoney(value).replace('R$ ', ''), fromCard.name, toCard.name));
    router.back();
  };

  const account = (card: typeof fromCard, label: string, onPress: () => void) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="h-[68px] bg-card rounded-[20px] px-4 flex-row items-center gap-3"
    >
      <View className="w-10 h-10 rounded-[14px] items-center justify-center" style={{ backgroundColor: `${card?.color ?? colors.subtle}1F` }}>
        <Icon name="account-balance-wallet" size={20} color={card?.color ?? colors.subtle} />
      </View>
      <View className="flex-1">
        <Text className="text-xs text-muted">{label}</Text>
        <Text className="text-base font-medium text-ink">{card?.name ?? SELECT_LABEL}</Text>
      </View>
      {card && <Text className="text-xs text-muted">{formatMoney(card.balance)}</Text>}
      <Icon name="expand-more" size={20} color={colors.subtle} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable accessibilityLabel={CLOSE_LABEL} onPress={() => router.back()} style={{ height: insets.top + SHEET_TOP_GAP }} />
      <KeyboardAvoidingView
        className="flex-1 bg-canvas rounded-t-[28px] overflow-hidden"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <Text className="text-[17px] font-bold text-ink">{TRANSFER_TITLE}</Text>
        </View>

        {cards.length < 2 ? (
          <View className="px-5 pt-4">
            <EmptyState icon="account-balance-wallet" message={NEED_TWO_ACCOUNTS} />
          </View>
        ) : (
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
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>
            </View>

            {account(fromCard, FROM_LABEL, () => setSheet('from'))}
            <View className="items-center -my-1.5">
              <TouchableOpacity
                onPress={() => {
                  setFromId(toId);
                  setToId(fromId);
                }}
                accessibilityLabel={SWAP_LABEL}
                className="w-10 h-10 rounded-full bg-surface items-center justify-center"
              >
                <Icon name="swap-vert" size={22} color={colors.primary.DEFAULT} />
              </TouchableOpacity>
            </View>
            {account(toCard, TO_LABEL, () => setSheet('to'))}

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

            <View className="bg-card rounded-[20px] px-4 py-3">
              <Text className="text-xs text-muted">{DESCRIPTION_LABEL}</Text>
              <TextInput
                className="text-base font-medium text-ink pt-1 pb-0"
                placeholder={DESCRIPTION_PLACEHOLDER}
                placeholderTextColor={colors.subtle}
                value={description}
                onChangeText={setDescription}
              />
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
        )}

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(_event, selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        <PickerSheet
          visible={sheet === 'from'}
          title={FROM_SHEET_TITLE}
          options={cards.map((c) => ({ id: c.id, name: c.name, sub: formatMoney(c.balance), icon: 'account-balance-wallet', color: c.color }))}
          selectedId={fromId}
          onSelect={(id) => {
            const next = Number(id);
            // Picking the account that is the destination swaps them instead of leaving both the same.
            if (next === toId) setToId(fromId);
            setFromId(next);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
        <PickerSheet
          visible={sheet === 'to'}
          title={TO_SHEET_TITLE}
          options={cards.map((c) => ({ id: c.id, name: c.name, sub: formatMoney(c.balance), icon: 'account-balance-wallet', color: c.color }))}
          selectedId={toId}
          onSelect={(id) => {
            const next = Number(id);
            if (next === fromId) setFromId(toId);
            setToId(next);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
