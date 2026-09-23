import React from 'react';
import { View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '../components/sidebar';
import CardBalance from './CardBalance';
import DashboardHeader from './components/DashboardHeader';
import CardsSection from './components/CardsSection';
import CategoriesSection from './components/CategoriesSection';
import { useCards, useCategoryTotals, useProfile, useTransactions } from '@/db/hooks';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function DashboardScreen() {
  const router = useRouter();
  const month = currentMonth();

  const { cards } = useCards();
  const { transactions } = useTransactions({ month });
  const { profile } = useProfile();
  const { totals: categoryTotals } = useCategoryTotals({ month });

  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalExpense = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const budgetOrTotal = profile?.monthlyBudget ?? totalExpense;

  return (
    <View className="flex-1 bg-[#F7F9FC]">
      <DashboardHeader onProfilePress={() => router.push('/editAcount')} />

      <ScrollView
        className="flex-1 -mt-5"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-7">
          <CardBalance
            valueTot={income - expense}
            valueEnt={income}
            valueSai={expense}
          />
        </View>

        <CardsSection cards={cards} onSeeAll={() => router.push('/wallet')} />
        <CategoriesSection
          categories={categoryTotals}
          budgetOrTotal={budgetOrTotal}
          onSeeAll={() => router.push('/myDetailing')}
        />
      </ScrollView>

      <SideBar />
    </View>
  );
}
