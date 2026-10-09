import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import ArrowBack from '../components/arrowBack';
import SideBar from '../components/sidebar';
import { deleteTransaction, getTransactionById, type TransactionRecord } from '@/db/transactions';
import { formatShortDate } from '@/utils/format';

export default function DetailsSpend() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = () => {
    if (!transaction) return;
    Alert.alert('Excluir transação', 'Tem certeza que deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await deleteTransaction(db, transaction.id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas px-6">
        <Text className="text-base text-muted text-center">Transação não encontrada.</Text>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#36A83A' : '#A83636';
  const prefix = isIncome ? '+' : '-';

  const rows: { label: string; value: string; color?: string }[] = [
    { label: 'Tipo', value: isIncome ? 'Receita' : 'Despesa', color: amountColor },
    { label: 'Categoria', value: transaction.categoryName },
    { label: 'Descrição', value: transaction.description || '—' },
    { label: 'Banco', value: transaction.cardName },
    { label: 'Data', value: formatShortDate(transaction.occurredAt) },
  ];

  return (
    <View className="flex-1 bg-canvas">
      <LinearGradient
        colors={['#1E3F7A', '#3161B2', '#4A74BB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pb-9 px-6"
        style={{ paddingTop: insets.top + 16 }}
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <ArrowBack />
            <Text className="text-white text-[14px] font-semibold">Detalhes</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/registrationSpent?id=${transaction.id}`)}
            className="w-[30px] h-[30px] rounded-[10px] bg-white/[.18] items-center justify-center"
          >
            <Icon name="edit" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2 mb-1.5">
          <View className="w-[22px] h-[22px] rounded-[7px] bg-white/[.22] items-center justify-center">
            <Icon name={transaction.categoryIcon} size={13} color="#fff" />
          </View>
          <Text className="text-white/80 text-xs">{transaction.name}</Text>
        </View>
        <Text className="text-white text-[30px] font-bold tracking-tight">
          {prefix} R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </Text>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-5"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-t-[20px] px-5 pt-1 shadow-sm shadow-black/5 elevation-2 mb-2">
          {rows.map((row, i) => (
            <View
              key={row.label}
              className={`flex-row justify-between items-center py-3.5 ${i < rows.length - 1 ? 'border-b border-line' : ''}`}
            >
              <Text className="text-xs text-muted">{row.label}</Text>
              <Text className="text-[13px] font-semibold" style={{ color: row.color ?? '#1A2B4A' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          className="flex-row items-center justify-center gap-1.5 py-3"
        >
          <Icon name="delete-outline" size={15} color="#A83636" />
          <Text className="text-expense font-medium text-xs">Excluir transação</Text>
        </TouchableOpacity>
      </ScrollView>

      <SideBar />
    </View>
  );
}
