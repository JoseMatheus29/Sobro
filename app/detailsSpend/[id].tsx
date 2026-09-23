import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View className="flex-1 items-center justify-center bg-[#F7F9FC]">
        <ActivityIndicator size="large" color="#3161B2" />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F9FC] px-6">
        <Text className="text-base text-[#718096] text-center">Transação não encontrada.</Text>
      </View>
    );
  }

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? '#36A83A' : '#A83636';
  const prefix = isIncome ? '+' : '-';

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <LinearGradient
        colors={['#1E3F7A', '#3161B2', '#4A74BB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="pt-14 pb-[52px] px-6"
      >
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-3">
            <ArrowBack />
            <Text className="text-white text-xl font-bold">Detalhes Transação</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/registrationSpent?id=${transaction.id}`)}
            className="w-9 h-9 rounded-xl bg-white/20 items-center justify-center"
          >
            <Icon name="edit" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <View className="w-[72px] h-[72px] rounded-full bg-white/20 items-center justify-center mb-3">
            <Icon name={transaction.categoryIcon} size={32} color="#fff" />
          </View>
          <Text className="text-white/80 text-sm font-semibold uppercase tracking-widest mb-1">
            {transaction.name}
          </Text>
          <Text className="text-white text-[32px] font-extrabold tracking-tight">
            {prefix} R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-6"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-white rounded-[24px] p-6 shadow-lg shadow-[#3161B2]/10 elevation-4 mb-4">
          <View className="flex-row justify-between items-center py-4 border-b border-[#EBF1F6]">
            <Text className="text-sm font-bold text-[#A0AEC0]">Tipo</Text>
            <Text className="text-base font-bold" style={{ color: amountColor }}>
              {isIncome ? 'Receita' : 'Despesa'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center py-4 border-b border-[#EBF1F6]">
            <Text className="text-sm font-bold text-[#A0AEC0]">Categoria</Text>
            <Text className="text-base font-bold text-[#1A2B4A]">{transaction.categoryName}</Text>
          </View>

          <View className="flex-row justify-between items-center py-4 border-b border-[#EBF1F6]">
            <Text className="text-sm font-bold text-[#A0AEC0]">Descrição</Text>
            <Text className="text-base font-bold text-[#1A2B4A]">{transaction.description || '—'}</Text>
          </View>

          <View className="flex-row justify-between items-center py-4 border-b border-[#EBF1F6]">
            <Text className="text-sm font-bold text-[#A0AEC0]">Banco</Text>
            <Text className="text-base font-bold text-[#1A2B4A]">{transaction.cardName}</Text>
          </View>

          <View className="flex-row justify-between items-center py-4">
            <Text className="text-sm font-bold text-[#A0AEC0]">Data</Text>
            <Text className="text-base font-bold text-[#1A2B4A]">{formatShortDate(transaction.occurredAt)}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDelete}
          className="flex-row items-center justify-center gap-1.5 bg-white rounded-2xl py-3.5 border border-[#EBF1F6]"
        >
          <Icon name="delete-outline" size={18} color="#A83636" />
          <Text className="text-[#A83636] font-semibold text-sm">Excluir transação</Text>
        </TouchableOpacity>
      </ScrollView>

      <SideBar />
    </View>
  );
}
