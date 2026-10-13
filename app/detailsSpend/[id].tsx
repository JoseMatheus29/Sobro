import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import ArrowBack from '@/app/components/arrowBack';
import SideBar from '@/app/components/sidebar';
import { SCROLL_PADDING_WITH_SIDEBAR } from '@/types/components/sidebar-type';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import GradientButton from '@/app/components/ui/GradientButton';
import PickerSheet from '@/app/components/ui/PickerSheet';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import EditForm from '@/app/detailsSpend/components/EditForm';
import RecurrenceCard from '@/app/detailsSpend/components/RecurrenceCard';
import TransferDetails from '@/app/detailsSpend/components/TransferDetails';
import {
  APPLY_CONFIRM,
  CARD_SHEET_TITLE,
  CATEGORY_SHEET_TITLE,
  DELETE_CONFIRM,
  DELETE_LABEL,
  DELETED_TOAST,
  DETAILS_TITLE,
  END_CONFIRM,
  ENDED_TOAST,
  FALLBACK_CATEGORY_ID,
  FIELD_LABELS,
  MISSING_HINT,
  NOT_FOUND_MESSAGE,
  RECURRENCE_ENDED_BY_TYPE,
  SAVE_LABEL,
  UPDATED_TITLE,
} from '@/types/detailsSpend/detailsSpend-type';
import { typeColors, type TxType } from '@/types/registrationSpent/registrationSpent-type';
import { categoriesForType, formatCents } from '@/utils/transactionForm';
import { useColors } from '@/hooks/useColors';
import { notifyDataChanged } from '@/db/events';
import { useCards, useCategories } from '@/db/hooks';
import { endRecurrence, getRecurrenceById, updateRecurrence } from '@/db/recurrences';
import { refreshReminders } from '@/db/reminders';
import { nextOccurrence } from '@/utils/recurrence';
import { type RecurrenceRecord } from '@/utils/recurrence-type';
import { deleteTransaction, getTransactionById, updateTransaction, type TransactionRecord } from '@/db/transactions';
import { tint } from '@/utils/color';

const toCents = (amount: number) => Math.round(Math.abs(amount) * 100).toString();

export default function DetailsSpend() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const db = useSQLiteContext();
  const { confirm, showToast } = useFeedback();
  const { categories } = useCategories();
  const { cards } = useCards();

  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // The form. It starts as a copy of the stored transaction and is compared with it to know what changed.
  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());

  const [sheet, setSheet] = useState<'category' | 'card' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const tx = await getTransactionById(db, Number(id));
      if (!cancelled) {
        setTransaction(tx);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, db]);

  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(toCents(transaction.amount));
    setName(transaction.name);
    setDescription(transaction.description ?? '');
    setCategoryId(transaction.categoryId);
    setCardId(transaction.cardId);
    setDate(new Date(transaction.occurredAt));
  }, [transaction]);

  // The recurring expense this transaction belongs to, if any.
  const recurrenceId = transaction?.recurrence?.id;
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found = recurrenceId !== undefined ? await getRecurrenceById(db, recurrenceId) : null;
      if (!cancelled) setRecurrence(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [recurrenceId, db]);

  // The tab bar would float above the keyboard and cover the form.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-base text-muted text-center">{NOT_FOUND_MESSAGE}</Text>
      </View>
    );
  }

  // The two legs of a transfer cannot be edited one by one: they are looked at, or undone together.
  if (transaction.transferId != null) return <TransferDetails transaction={transaction} />;

  const cents = parseInt(amount || '0', 10) || 0;
  const typeColor = typeColors(colors)[type];
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const card = cards.find((c) => c.id === cardId) ?? null;

  const dirty =
    type !== transaction.type ||
    amount !== toCents(transaction.amount) ||
    name !== transaction.name ||
    description !== (transaction.description ?? '') ||
    categoryId !== transaction.categoryId ||
    cardId !== transaction.cardId ||
    date.toISOString() !== new Date(transaction.occurredAt).toISOString();
  // What still blocks saving, by field name, so the screen can say it instead of just staying gray.
  const missing = [
    cents === 0 ? FIELD_LABELS.amount : null,
    name.trim() ? null : FIELD_LABELS.name,
    categoryId ? null : FIELD_LABELS.category,
    cardId ? null : FIELD_LABELS.card,
  ].filter((label): label is string => label !== null);
  const canSave = dirty && missing.length === 0;

  // A category picked for one direction may not exist for the other: fall back to a valid one
  // instead of leaving the field empty, which would silently block saving.
  const handleTypeChange = (next: TxType) => {
    setType(next);
    const allowed = categoriesForType(categories, next);
    if (categoryId && !allowed.some((c) => c.id === categoryId)) {
      setCategoryId((allowed.find((c) => c.id === FALLBACK_CATEGORY_ID) ?? allowed[0])?.id ?? null);
    }
  };

  const handleSave = async () => {
    if (!canSave || !categoryId || !cardId) return;

    // A change to a recurring expense can also be applied to the occurrences still to come.
    const active = recurrence !== null && nextOccurrence(recurrence) !== null;
    const turnedIntoIncome = active && type === 'income';
    const changedForNext =
      active &&
      !turnedIntoIncome &&
      (cents !== Math.round(Math.abs(transaction.amount) * 100) ||
        name.trim() !== transaction.name ||
        categoryId !== transaction.categoryId ||
        cardId !== transaction.cardId);
    const applyToNext = changedForNext ? await confirm(APPLY_CONFIRM) : false;

    await updateTransaction(db, transaction.id, {
      cardId,
      categoryId,
      name: name.trim(),
      description: description.trim() || null,
      amount: cents / 100,
      type,
      occurredAt: date.toISOString(),
    });
    if (recurrence && applyToNext) {
      await updateRecurrence(db, recurrence.id, { cardId, categoryId, name: name.trim(), amount: cents / 100 });
    }
    if (recurrence && turnedIntoIncome) await endRecurrence(db, recurrence.id);
    if (recurrence && (applyToNext || turnedIntoIncome)) {
      setRecurrence(await getRecurrenceById(db, recurrence.id));
      notifyDataChanged();
      await refreshReminders(db);
    }
    setTransaction(await getTransactionById(db, transaction.id));
    Keyboard.dismiss();
    showToast({
      type: 'success',
      title: UPDATED_TITLE,
      message: turnedIntoIncome
        ? RECURRENCE_ENDED_BY_TYPE
        : `R$ ${formatCents(cents)} em ${category?.name ?? ''}`.trim(),
      icon: category?.icon,
    });
  };

  const handleEndRecurrence = async () => {
    if (!recurrence || !(await confirm(END_CONFIRM))) return;
    await endRecurrence(db, recurrence.id);
    setRecurrence(await getRecurrenceById(db, recurrence.id));
    notifyDataChanged();
    await refreshReminders(db);
    showToast(ENDED_TOAST);
  };

  const handleDelete = async () => {
    if (!(await confirm(DELETE_CONFIRM))) return;
    await deleteTransaction(db, transaction.id);
    showToast(DELETED_TOAST);
    router.back();
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-canvas" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll bottomPadding={SCROLL_PADDING_WITH_SIDEBAR} keyboardShouldPersistTaps="handled">
        <ScreenHeader title={DETAILS_TITLE} leftComponent={<ArrowBack />}>
          {/* Same composition as the Perfil hero, and it follows what is typed below. */}
          <View className="items-center">
            <View className="w-14 h-14 rounded-[18px] bg-headerInk/20 items-center justify-center">
              <Icon name={category?.icon ?? 'category'} size={28} color={colors.headerInk} />
            </View>
            <Text numberOfLines={1} className="text-base font-medium text-headerInk/90 mt-3">{name.trim() || '—'}</Text>
            <Text className="text-4xl font-extrabold text-headerInk tracking-tight mt-1">
              {type === 'income' ? '+' : '-'} R$ {formatCents(cents)}
            </Text>
          </View>
        </ScreenHeader>

        <View className="px-5 -mt-7">
          <EditForm
            typeColor={typeColor}
            type={type}
            setType={handleTypeChange}
            amount={amount}
            setAmount={setAmount}
            name={name}
            setName={setName}
            category={category}
            card={card}
            date={date}
            description={description}
            setDescription={setDescription}
            onPickCategory={() => setSheet('category')}
            onPickCard={() => setSheet('card')}
            onPickDate={() => setShowDatePicker(true)}
          />

          {recurrence && transaction.recurrence && (
          <RecurrenceCard
            recurrence={recurrence}
            installment={transaction.recurrence.installment}
            onEnd={handleEndRecurrence}
          />
        )}

        <View pointerEvents={canSave ? 'auto' : 'none'}>
            <GradientButton
              title={SAVE_LABEL}
              onPress={handleSave}
              colors={canSave ? undefined : colors.disabledGradient}
              shadowColor={canSave ? undefined : colors.disabledGradient[0]}
            />
          </View>

          {dirty && missing.length > 0 && (
            <Text className="text-[13px] text-expense text-center mt-2">
              {MISSING_HINT}: {missing.join(', ').toLowerCase()}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleDelete}
            activeOpacity={0.8}
            className="h-[52px] mt-3 rounded-2xl flex-row items-center justify-center gap-2"
            style={{ backgroundColor: tint(colors.expense) }}
          >
            <Icon name="delete-outline" size={20} color={colors.expense} />
            <Text className="text-[15px] font-bold text-expense">{DELETE_LABEL}</Text>
          </TouchableOpacity>
        </View>
      </ScreenScroll>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event, selected) => {
            setShowDatePicker(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <PickerSheet
        visible={sheet === 'category'}
        title={CATEGORY_SHEET_TITLE}
        options={categoriesForType(categories, type).map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
        }))}
        selectedId={categoryId}
        onSelect={(value) => {
          setCategoryId(String(value));
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <PickerSheet
        visible={sheet === 'card'}
        title={CARD_SHEET_TITLE}
        options={cards.map((c) => ({
          id: c.id,
          name: c.name,
          sub: c.number ? `•••• ${c.number}` : undefined,
          icon: 'account-balance-wallet',
          color: c.color,
        }))}
        selectedId={cardId}
        onSelect={(value) => {
          setCardId(Number(value));
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />

      {!keyboardVisible && <SideBar />}
    </KeyboardAvoidingView>
  );
}
