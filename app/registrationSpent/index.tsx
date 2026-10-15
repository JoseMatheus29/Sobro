import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCards, useCategories } from '@/db/hooks';
import { notifyDataChanged } from '@/db/events';
import { ensureReminderPermission, refreshReminders } from '@/db/reminders';
import { createTransaction } from '@/db/transactions';
import { calendarDayAtNoonUtc, centsToAmount } from '@/utils/apiInput';
import { errorToast } from '@/utils/apiErrors';
import { useSaveKey } from '@/hooks/useSaveKey';
import { type RepeatInput } from '@/api/types';
import { type RepeatMode } from '@/utils/recurrence-type';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import LoadError from '@/app/components/ui/LoadError';
import LoadingBlock from '@/app/components/ui/LoadingBlock';
import AmountStep from '@/app/registrationSpent/components/AmountStep';
import CategoryStep from '@/app/registrationSpent/components/CategoryStep';
import DetailsStep from '@/app/registrationSpent/components/DetailsStep';
import FlowButton from '@/app/registrationSpent/components/FlowButton';
import FlowHeader from '@/app/registrationSpent/components/FlowHeader';
import {
  CLOSE_LABEL,
  FlowStep,
  SAVE_LABELS,
  REPEATING_TOAST_SUFFIX,
  SAVE_FAILED_TITLE,
  SAVED_TITLES,
  SHEET_DIM_COLOR,
  SHEET_TOP_GAP,
  TITLES,
  typeColors,
  VALIDATION_MESSAGES,
  TxType,
} from '@/types/registrationSpent/registrationSpent-type';
import { categoriesForType, formatCents } from '@/utils/transactionForm';
import { useColors } from '@/hooks/useColors';
import { KEYBOARD_AVOIDING_BEHAVIOR } from '@/types/components/ui/keyboard-type';

export default function RegistrationSpent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const saveKey = useSaveKey();

  const { categories, loading: loadingCategories, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { cards, loading: loadingCards, error: cardsError, refetch: refetchCards } = useCards();

  const [step, setStep]               = useState<FlowStep>(1);
  const [type, setType]               = useState<TxType>('expense');
  const [amount, setAmount]           = useState('');
  const [nome, setNome]               = useState('');
  const [descricao, setDescricao]     = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [date, setDate]               = useState(new Date());
  const [repeat, setRepeat]           = useState<RepeatMode>('none');
  const [installments, setInstallments] = useState(10);
  const [currentInstallment, setCurrentInstallment] = useState(1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Android back goes one step back first, and only closes the sheet from step 1.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep((step - 1) as FlowStep);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  // Default to the first card, once cards load.
  useEffect(() => {
    if (selectedCardId === null && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [selectedCardId, cards]);

  const colors = useColors();
  const typeColor = typeColors(colors)[type];
  const amountText = formatCents(parseInt(amount || '0', 10) || 0);
  const visibleCategories = categoriesForType(categories, type);
  const category = categories.find((c) => c.id === selectedCat) ?? null;

  // A category picked for one direction may not exist for the other.
  const handleTypeChange = (next: TxType) => {
    setType(next);
    if (selectedCat && !categoriesForType(categories, next).some((c) => c.id === selectedCat)) {
      setSelectedCat(null);
    }
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((step - 1) as FlowStep);
  };

  const handlePickCategory = (catId: string) => {
    setSelectedCat(catId);
    setStep(3);
  };

  const handleSalvar = async () => {
    if (saving) return;
    const invalid = (message: string) => showToast({ type: 'error', title: message });
    if (!amount) return invalid(VALIDATION_MESSAGES.amount);
    if (!selectedCat) return invalid(VALIDATION_MESSAGES.category);
    if (!selectedCardId) return invalid(VALIDATION_MESSAGES.card);
    if (!nome.trim()) return invalid(VALIDATION_MESSAGES.name);

    // Only an expense repeats. The transaction made here is the first occurrence; the server makes the
    // following ones when they fall due, and they show up as planned until then.
    const repeating = type === 'expense' && repeat !== 'none';
    const repeatInput: RepeatInput | undefined = !repeating
      ? undefined
      : repeat === 'installments'
        ? { mode: 'installments', total: installments, current: currentInstallment }
        : { mode: 'monthly' };

    const input = {
      cardId: selectedCardId,
      categoryId: selectedCat,
      name: nome.trim(),
      description: descricao.trim() || undefined,
      amount: centsToAmount(parseInt(amount, 10)),
      type,
      // The day on the phone's calendar, not an instant: at 22h in Brazil it is already tomorrow in UTC.
      occurredAt: calendarDayAtNoonUtc(date),
      ...(repeatInput ? { repeat: repeatInput } : {}),
    };

    setSaving(true);
    try {
      // The same key on a retry of the same form, so a lost answer never makes two transactions.
      await createTransaction(input, saveKey.keyFor(input));
      saveKey.clear();
    } catch (error) {
      // The form stays as it is, so the person can try again.
      showToast(errorToast(error, SAVE_FAILED_TITLE));
      setSaving(false);
      return;
    }

    notifyDataChanged();
    // The first recurrence is the moment to ask to notify, in context; the reminders follow what is planned.
    if (repeating) {
      await ensureReminderPermission();
      await refreshReminders();
    }

    // The toast lives above the navigator, so it stays on screen after the sheet closes.
    showToast({
      type: 'success',
      title: SAVED_TITLES[type],
      message: `R$ ${amountText} em ${category?.name ?? ''}${repeating ? ` · ${REPEATING_TOAST_SUFFIX[repeat as 'monthly' | 'installments']}` : ''}`.trim(),
      icon: category?.icon,
    });
    router.back();
  };

  // Sheet frame: dimmed backdrop (tap to close) above a rounded surface.
  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable
        accessibilityLabel={CLOSE_LABEL}
        onPress={() => router.back()}
        style={{ height: insets.top + SHEET_TOP_GAP }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-canvas rounded-t-[28px] overflow-hidden"
        behavior={KEYBOARD_AVOIDING_BEHAVIOR}
      >
        <FlowHeader title={TITLES[type]} step={step} onBack={handleBack} />

        {step === 1 && (
          <AmountStep
            type={type}
            setType={handleTypeChange}
            amount={amount}
            setAmount={setAmount}
            typeColor={typeColor}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && categoriesError ? (
          <LoadError error={categoriesError} onRetry={() => refetchCategories()} />
        ) : step === 2 && loadingCategories && categories.length === 0 ? (
          <LoadingBlock />
        ) : step === 2 ? (
          <CategoryStep
            type={type}
            categories={visibleCategories}
            selectedCat={selectedCat}
            amountText={amountText}
            typeColor={typeColor}
            onPick={handlePickCategory}
            onCategoryCreated={refetchCategories}
          />
        ) : null}

        {step === 3 && cardsError ? (
          <LoadError error={cardsError} onRetry={() => refetchCards()} />
        ) : step === 3 && loadingCards && cards.length === 0 ? (
          <LoadingBlock />
        ) : step === 3 ? (
          <>
            <DetailsStep
              typeColor={typeColor}
              amountText={amountText}
              category={category}
              nome={nome} setNome={setNome}
              descricao={descricao} setDescricao={setDescricao}
              cards={cards}
              selectedCardId={selectedCardId}
              setSelectedCardId={setSelectedCardId}
              date={date} setDate={setDate}
              onEditAmount={() => setStep(1)}
              onEditCategory={() => setStep(2)}
              type={type}
              amountValue={(parseInt(amount || '0', 10) || 0) / 100}
              repeat={repeat}
              setRepeat={setRepeat}
              installments={installments}
              setInstallments={setInstallments}
              currentInstallment={currentInstallment}
              setCurrentInstallment={setCurrentInstallment}
            />
            <FlowButton
              label={SAVE_LABELS[type]}
              type={type}
              disabled={!amount || !selectedCat || !selectedCardId || !nome.trim() || saving}
              compact={keyboardVisible}
              onPress={handleSalvar}
            />
          </>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}
