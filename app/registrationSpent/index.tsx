import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '../components/sidebar';
import GradientButton from '../components/ui/GradientButton';
import DynamicHeader from './components/DynamicHeader';
import CategorySelector from './components/CategorySelector';
import CardSelector from './components/CardSelector';
import TransactionDetails from './components/TransactionDetails';
import { TxType } from './registrationSpent-type';
import { useCards, useCategories } from '@/db/hooks';
import { createTransaction, getTransactionById, updateTransaction } from '@/db/transactions';

export default function RegistrationSpent() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editingId = id ? Number(id) : null;

  const { categories, refetch: refetchCategories } = useCategories();
  const { cards } = useCards();

  const [type, setType]               = useState<TxType>('expense');
  const [amount, setAmount]           = useState('');
  const [nome, setNome]               = useState('');
  const [descricao, setDescricao]     = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [date, setDate]               = useState(new Date());
  const [focused, setFocused]         = useState('');
  const [loadingExisting, setLoadingExisting] = useState(!!editingId);

  // Prefill the form from the existing transaction when opened in edit mode.
  useEffect(() => {
    if (!editingId) return;
    let cancelled = false;
    (async () => {
      const tx = await getTransactionById(db, editingId);
      if (!tx || cancelled) return;
      setType(tx.type);
      setAmount(Math.round(Math.abs(tx.amount) * 100).toString());
      setNome(tx.name);
      setDescricao(tx.description ?? '');
      setSelectedCat(tx.categoryId);
      setSelectedCardId(tx.cardId);
      setDate(new Date(tx.occurredAt));
      setLoadingExisting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editingId, db]);

  // Default to the first card for a brand-new transaction, once cards load.
  useEffect(() => {
    if (!editingId && selectedCardId === null && cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [editingId, selectedCardId, cards]);

  const isExpense = type === 'expense';
  const primaryColor = isExpense ? '#A83636' : '#36A83A';
  const gradientColors: [string, string, string] = isExpense
    ? ['#7A1F1F', '#A83636', '#C0514A']
    : ['#1A5C1F', '#36A83A', '#4ABD4F'];

  const formatAmount = (raw: string) => {
    const nums = raw.replace(/\D/g, '');
    if (!nums) return '';
    const cents = parseInt(nums, 10);
    return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const handleSalvar = async () => {
    if (!amount) { Alert.alert('Atenção', 'Informe o valor da transação.'); return; }
    if (!selectedCat) { Alert.alert('Atenção', 'Selecione uma categoria.'); return; }
    if (!selectedCardId) { Alert.alert('Atenção', 'Selecione uma conta.'); return; }
    if (!nome.trim()) { Alert.alert('Atenção', 'Informe o nome da transação.'); return; }

    const payload = {
      cardId: selectedCardId,
      categoryId: selectedCat,
      name: nome.trim(),
      description: descricao.trim() || undefined,
      amount: parseInt(amount, 10) / 100,
      type,
      occurredAt: date.toISOString(),
    };

    if (editingId) {
      await updateTransaction(db, editingId, payload);
      Alert.alert('✅ Transação atualizada!', `${isExpense ? 'Saída' : 'Entrada'} de R$ ${formatAmount(amount)} atualizada.`, [
        { text: 'Ok', onPress: () => router.back() },
      ]);
    } else {
      await createTransaction(db, payload);
      Alert.alert('✅ Transação salva!', `${isExpense ? 'Saída' : 'Entrada'} de R$ ${formatAmount(amount)} registrada.`, [
        { text: 'Ok', onPress: () => router.push('/dashboard') },
      ]);
    }
  };

  if (loadingExisting) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F9FC]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DynamicHeader
        title={editingId ? 'Editar Transação' : 'Nova Transação'}
        type={type} setType={setType}
        amount={amount} setAmount={setAmount}
        gradientColors={gradientColors}
        formatAmount={formatAmount}
      />

      <ScrollView
        className="flex-1 -mt-5"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CategorySelector
          categories={categories}
          selectedCat={selectedCat}
          setSelectedCat={setSelectedCat}
          onCategoryCreated={refetchCategories}
        />

        <CardSelector
          cards={cards}
          selectedCardId={selectedCardId}
          setSelectedCardId={setSelectedCardId}
        />

        <TransactionDetails
          nome={nome} setNome={setNome}
          descricao={descricao} setDescricao={setDescricao}
          focused={focused} setFocused={setFocused}
          primaryColor={primaryColor}
          date={date} setDate={setDate}
        />

        <GradientButton
          title={editingId ? 'Salvar Alterações' : `Registrar ${isExpense ? 'Saída' : 'Entrada'}`}
          onPress={handleSalvar}
          colors={gradientColors.slice(0, 2) as [string, string]}
          shadowColor={primaryColor}
        />
      </ScrollView>

      <SideBar />
    </KeyboardAvoidingView>
  );
}
