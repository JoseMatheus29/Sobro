import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import SideBar from '@/app/components/sidebar';
import AddTransactionFab from '@/app/components/AddTransactionFab';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import MonthPill from '@/app/components/month/MonthPill';
import { useSelectedMonth } from '@/app/components/month/MonthProvider';
import PickerSheet from '@/app/components/ui/PickerSheet';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import TransactionList from '@/app/components/ui/TransactionList';
import { categoriesForType } from '@/utils/transactionForm';
import CategoryLimits from '@/app/myDetailing/components/CategoryLimits';
import ExpenseChart from '@/app/myDetailing/components/ExpenseChart';
import LimitSheet from '@/app/myDetailing/components/LimitSheet';
import MonthlyProgress from '@/app/myDetailing/components/MonthlyProgress';
import { setCategoryBudgetFrom } from '@/db/categoryBudgets';
import { useBudgetEntries, useCategories, useCategoryBudgets, useCategoryTotals, useTransactions } from '@/db/hooks';
import { budgetForMonth } from '@/utils/budget';
import { limitsForMonth } from '@/utils/categoryBudget';
import { formatShortDate } from '@/utils/format';
import { monthKey } from '@/utils/month';
import { recurrenceBadge } from '@/utils/recurrence';
import { withoutTransfers } from '@/utils/transfer';
import {
  EMPTY_TRANSACTIONS_MESSAGE,
  LIMIT_INVALID_TOAST,
  LIMIT_PICKER_TITLE,
  LIMIT_REMOVED_TOAST,
  LIMIT_SAVED_TOAST,
  type LimitRow,
} from '@/types/myDetailing/myDetailing-type';

export default function MyDetailing() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { showToast } = useFeedback();
  const { month, isCurrent } = useSelectedMonth();

  const { transactions } = useTransactions({ month });
  const { totals: categoryTotals } = useCategoryTotals({ month });
  const { entries: budgetEntries } = useBudgetEntries();
  const { entries: limitEntries, refetch: refetchLimits } = useCategoryBudgets();
  const { categories } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const totalGastos = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const pieData = categoryTotals.map((c) => ({
    value: totalGastos > 0 ? Math.round((c.total / totalGastos) * 100) : 0,
    color: c.color,
    label: c.categoryName,
  }));

  const budget = budgetForMonth(budgetEntries, month);
  const hasBudget = budget !== null && budget > 0;
  const progress = hasBudget ? Math.min(totalGastos / budget, 1) : 0;
  const percentage = Math.round(progress * 100);

  // Spending limits per category: the ones in force in the month shown, beside what was spent.
  const limits = limitsForMonth(limitEntries, month);
  const expenseCategories = categoriesForType(categories, 'expense');
  const limitRows: LimitRow[] = expenseCategories
    .map((c) => ({
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      spent: categoryTotals.find((t) => t.categoryId === c.id)?.total ?? 0,
      limit: limits[c.id] ?? null,
    }))
    .filter((row) => row.spent > 0 || row.limit !== null)
    .sort((a, b) => (b.limit !== null ? b.spent / b.limit : -1) - (a.limit !== null ? a.spent / a.limit : -1));

  const editing = expenseCategories.find((c) => c.id === editingId) ?? null;
  const editingLimit = editingId ? limits[editingId] : undefined;

  const handleSaveLimit = async (amount: number) => {
    if (!editingId) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast(LIMIT_INVALID_TOAST);
      return;
    }
    await setCategoryBudgetFrom(db, editingId, monthKey(new Date()), amount);
    await refetchLimits();
    setEditingId(null);
    showToast(LIMIT_SAVED_TOAST);
  };

  const handleRemoveLimit = async () => {
    if (!editingId) return;
    await setCategoryBudgetFrom(db, editingId, monthKey(new Date()), null);
    await refetchLimits();
    setEditingId(null);
    showToast(LIMIT_REMOVED_TOAST);
  };

  const displayTransactions = withoutTransfers(transactions)
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
      badge: t.recurrence ? recurrenceBadge(t.recurrence) : undefined,
      planned: t.planned,
    }));

  return (
    <View className="flex-1 bg-canvas">
      {/* The header scrolls with the content: a fixed one, with the content pulled up over it,
          cut the content off at its edge while scrolling. */}
      <ScreenScroll>
        <ScreenHeader
          title="Meu Detalhamento"
        >
          <View className="items-center">
            <MonthPill />
          </View>
        </ScreenHeader>

        <View className="-mt-7">
          <ExpenseChart pieData={pieData} totalGastos={totalGastos} />

          <MonthlyProgress
            totalGastos={totalGastos}
            progress={progress}
            percentage={percentage}
            hasBudget={hasBudget}
          />

          <CategoryLimits
            rows={limitRows}
            canEdit={isCurrent}
            onPressRow={setEditingId}
            onAdd={() => setPicking(true)}
          />

          <TransactionList
            title="Seus Gastos"
            emptyMessage={EMPTY_TRANSACTIONS_MESSAGE}
            transactions={displayTransactions}
            onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
          />
        </View>
      </ScreenScroll>

      <LimitSheet
        visible={editing !== null}
        categoryName={editing?.name ?? ''}
        initialValue={editingLimit !== undefined ? String(editingLimit) : ''}
        hasLimit={editingLimit !== undefined}
        onSave={handleSaveLimit}
        onRemove={handleRemoveLimit}
        onClose={() => setEditingId(null)}
      />
      <PickerSheet
        visible={picking}
        title={LIMIT_PICKER_TITLE}
        options={expenseCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }))}
        selectedId={null}
        onSelect={(id) => {
          setPicking(false);
          setEditingId(String(id));
        }}
        onClose={() => setPicking(false)}
      />

      <SideBar />
      <AddTransactionFab />
    </View>
  );
}
