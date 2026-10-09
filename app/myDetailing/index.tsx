import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import AddTransactionFab from '../components/AddTransactionFab';
import ScreenHeader from '../components/ui/ScreenHeader';
import ScreenScroll from '../components/ui/ScreenScroll';
import TransactionList from '../components/ui/TransactionList';
import ExpenseChart from './components/ExpenseChart';
import MonthlyProgress from './components/MonthlyProgress';
import { useCategoryTotals, useProfile, useTransactions } from '@/db/hooks';
import { formatShortDate } from '@/utils/format';
import { EMPTY_TRANSACTIONS_MESSAGE } from './myDetailing-type';

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
      categoryColor: t.categoryColor,
      type: t.type,
    }));

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll>
        <ScreenHeader
          title="Meu Detalhamento"
          gradientColors={['#254E8F', '#3161B2', '#4A74BB']}
        />

        <View className="-mt-7">
          <ExpenseChart pieData={pieData} totalGastos={totalGastos} />

          <MonthlyProgress
            totalGastos={totalGastos}
            progress={progress}
            percentage={percentage}
            hasBudget={hasBudget}
          />

          <TransactionList
            title="Seus Gastos"
            emptyMessage={EMPTY_TRANSACTIONS_MESSAGE}
            transactions={displayTransactions}
            onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
          />
        </View>
      </ScreenScroll>

      <SideBar />
      <AddTransactionFab />
    </View>
  );
}
