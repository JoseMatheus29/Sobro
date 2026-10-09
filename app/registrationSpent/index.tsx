import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCards, useCategories } from '@/db/hooks';
import { createTransaction } from '@/db/transactions';
import { useFeedback } from '../components/feedback/FeedbackProvider';
import AmountStep from './components/AmountStep';
import CategoryStep from './components/CategoryStep';
import DetailsStep from './components/DetailsStep';
import FlowButton from './components/FlowButton';
import FlowHeader from './components/FlowHeader';
import {
  CLOSE_LABEL,
  FlowStep,
  SAVE_LABELS,
  SAVED_TITLES,
  SHEET_DIM_COLOR,
  SHEET_TOP_GAP,
  TITLES,
  TYPE_COLORS,
  VALIDATION_MESSAGES,
  TxType,
} from './registrationSpent-type';
import { categoriesForType, formatCents } from './utils';

export default function RegistrationSpent() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedback();
  const db = useSQLiteContext();

  const { categories, refetch: refetchCategories } = useCategories();
  const { cards } = useCards();

  const [step, setStep]               = useState<FlowStep>(1);
  const [type, setType]               = useState<TxType>('expense');
  const [amount, setAmount]           = useState('');
  const [nome, setNome]               = useState('');
  const [descricao, setDescricao]     = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [date, setDate]               = useState(new Date());
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  const typeColor = TYPE_COLORS[type];
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
    const invalid = (message: string) => showToast({ type: 'error', title: message });
    if (!amount) return invalid(VALIDATION_MESSAGES.amount);
    if (!selectedCat) return invalid(VALIDATION_MESSAGES.category);
    if (!selectedCardId) return invalid(VALIDATION_MESSAGES.card);
    if (!nome.trim()) return invalid(VALIDATION_MESSAGES.name);

    await createTransaction(db, {
      cardId: selectedCardId,
      categoryId: selectedCat,
      name: nome.trim(),
      description: descricao.trim() || undefined,
      amount: parseInt(amount, 10) / 100,
      type,
      occurredAt: date.toISOString(),
    });

    // The toast lives above the navigator, so it stays on screen after the sheet closes.
    showToast({
      type: 'success',
      title: SAVED_TITLES[type],
      message: `R$ ${amountText} em ${category?.name ?? ''}`.trim(),
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        {step === 2 && (
          <CategoryStep
            type={type}
            categories={visibleCategories}
            selectedCat={selectedCat}
            amountText={amountText}
            typeColor={typeColor}
            onPick={handlePickCategory}
            onCategoryCreated={refetchCategories}
          />
        )}

        {step === 3 && (
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
            />
            <FlowButton
              label={SAVE_LABELS[type]}
              type={type}
              disabled={!amount || !selectedCat || !selectedCardId || !nome.trim()}
              compact={keyboardVisible}
              onPress={handleSalvar}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
