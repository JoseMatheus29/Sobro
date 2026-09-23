import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import ScreenHeader from '../components/ui/ScreenHeader';
import TransactionList from '../components/ui/TransactionList';
import ExpenseChart from './components/ExpenseChart';
import MonthlyProgress from './components/MonthlyProgress';
import { useCategoryTotals, useProfile, useTransactions } from '@/db/hooks';
import { formatShortDate } from '@/utils/format';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function MyDetailing() {
  const router = useRouter();
  const month = currentMonth();

  const { transactions } = useTransactions({ month });
  const { totals: categoryTotals } = useCategoryTotals({ month });
  const { profile } = useProfile();

  const totalGastos = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const pieData = categoryTotals.map((c) => ({
    value: totalGastos > 0 ? Math.round((c.total / totalGastos) * 100) : 0,
    color: c.color,
    label: c.categoryName,
  }));

  const hasBudget = profile?.monthlyBudget != null;
  const progress = hasBudget ? Math.min(totalGastos / (profile!.monthlyBudget as number), 1) : 0;
  const percentage = Math.round(progress * 100);

  const displayTransactions = transactions
    .filter((t) => t.type === 'expense')
    .map((t) => ({
      id: t.id,
      name: t.name,
      date: formatShortDate(t.occurredAt),
      amount: t.amount,
      category: t.categoryName,
      categoryIcon: t.categoryIcon,
      type: t.type,
    }));

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <ScreenHeader
        title="Meu Detalhamento"
        gradientColors={['#254E8F', '#3161B2', '#4A74BB']}
      />

      <ScrollView
        className="flex-1 -mt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {pieData.length > 0 ? (
          <ExpenseChart pieData={pieData} totalGastos={totalGastos} />
        ) : (
          <View className="bg-white mx-4 rounded-3xl p-5 mb-4 shadow-lg shadow-[#3161B2]/10 elevation-4">
            <Text className="text-sm text-[#A0AEC0] text-center">Nenhum gasto registrado neste mês.</Text>
          </View>
        )}

        <MonthlyProgress
          totalGastos={totalGastos}
          progress={progress}
          percentage={percentage}
          hasBudget={hasBudget}
        />

        <TransactionList
          title="Seus Gastos"
          actionLabel="Ver todos"
          transactions={displayTransactions}
          onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
        />
      </ScrollView>

      <SideBar />
    </View>
  );
}
