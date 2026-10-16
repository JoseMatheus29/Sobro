import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';

import SideBar from '@/app/components/sidebar';
import AddTransactionFab from '@/app/components/AddTransactionFab';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import MonthPill from '@/app/components/month/MonthPill';
import { useSelectedMonth } from '@/app/components/month/MonthProvider';
import LoadError from '@/app/components/ui/LoadError';
import LoadingBlock from '@/app/components/ui/LoadingBlock';
import PickerSheet from '@/app/components/ui/PickerSheet';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import ScreenScroll from '@/app/components/ui/ScreenScroll';
import TransactionList from '@/app/components/ui/TransactionList';
import { categoriesForType } from '@/utils/transactionForm';
import CategoryLimits from '@/app/myDetailing/components/CategoryLimits';
import AccountFilter from '@/app/myDetailing/components/AccountFilter';
import ExpenseChart from '@/app/myDetailing/components/ExpenseChart';
import LimitSheet from '@/app/myDetailing/components/LimitSheet';
import MonthlyProgress from '@/app/myDetailing/components/MonthlyProgress';
import PaymentSplitCard from '@/app/myDetailing/components/PaymentSplitCard';
import { setCategoryBudgetFrom } from '@/db/categoryBudgets';
import { notifyDataChanged } from '@/db/events';
import { useBudgetEntries, useCards, useCategories, useCategoryBudgets, useTransactions } from '@/db/hooks';
import { spendingByCategory, spendingByPayment } from '@/utils/spending';
import { budgetForMonth } from '@/utils/budget';
import { limitsForMonth } from '@/utils/categoryBudget';
import { formatShortDate } from '@/utils/format';
import { currentMonthKey } from '@/utils/month';
import { errorMessage } from '@/utils/apiErrors';
import { type ToastOptions } from '@/types/components/feedback/feedback-type';
import { recurrenceBadge } from '@/utils/recurrence';
import { withoutTransfers } from '@/utils/transfer';
import {
  EMPTY_TRANSACTIONS_MESSAGE,
  LIMIT_FAILED_MESSAGE,
  LIMIT_INVALID_TOAST,
  LIMIT_PICKER_TITLE,
  LIMIT_REMOVED_TOAST,
  LIMIT_SAVED_TOAST,
  type LimitRow,
} from '@/types/myDetailing/myDetailing-type';

export default function MyDetailing() {
  const router = useRouter();
  const { showToast } = useFeedback();
  const { month, isCurrent } = useSelectedMonth();

  const { transactions, loading: detailLoading, error: detailError, refetch: refetchTransactions } = useTransactions({ month });
  const { entries: budgetEntries } = useBudgetEntries();
  const { entries: limitEntries } = useCategoryBudgets();
  const { categories } = useCategories();
  const { cards } = useCards();
  // "Todas", or one account: the chart, the spending, how it was paid and the list are all about what is picked.
  const [pickedAccountId, setPickedAccountId] = useState<number | null>(null);
  const accountId = cards.some((c) => c.id === pickedAccountId) ? pickedAccountId : null;
  const scopeName = accountId !== null ? (cards.find((c) => c.id === accountId)?.name ?? null) : null;
  const scoped = accountId === null ? transactions : transactions.filter((t) => t.cardId === accountId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  // Inside the limit dialog: a toast would be drawn behind it.
  const [limitError, setLimitError] = useState<string | null>(null);

  // The month's spending by category: the same sum the server makes, done here so one account can be looked at.
  const categoryTotals = spendingByCategory(scoped);
  const totalGastos = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const pieData = categoryTotals.map((c) => ({
    value: totalGastos > 0 ? Math.round((c.total / totalGastos) * 100) : 0,
    color: c.color,
    label: c.categoryName,
  }));

  // How the spending was paid: only worth showing when at least some of the expenses say how.
  const split = spendingByPayment(scoped);
  const showSplit = split.slices.some((slice) => slice.kind !== 'other');

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

  // The limit applies from the current month on; the months already over keep the one they had.
  const saveLimit = async (amount: number | null, done: ToastOptions) => {
    if (!editingId) return;
    setLimitError(null);
    try {
      await setCategoryBudgetFrom(editingId, currentMonthKey(), amount);
      await notifyDataChanged();
    } catch (error) {
      setLimitError(errorMessage(error, LIMIT_FAILED_MESSAGE));
      return;
    }
    setEditingId(null);
    showToast(done);
  };

  const handleSaveLimit = async (amount: number) => {
    if (!editingId) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast(LIMIT_INVALID_TOAST);
      return;
    }
    await saveLimit(amount, LIMIT_SAVED_TOAST);
  };

  const handleRemoveLimit = async () => {
    if (!editingId) return;
    await saveLimit(null, LIMIT_REMOVED_TOAST);
  };

  const displayTransactions = withoutTransfers(scoped)
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
          {cards.length > 1 && (
            <AccountFilter
              accounts={cards.map((c) => ({ id: c.id, name: c.name }))}
              selectedId={accountId}
              onSelect={setPickedAccountId}
            />
          )}

          {detailError ? (
            <View className="mx-4 bg-card rounded-[24px]">
              <LoadError
                error={detailError}
                onRetry={() => {
                  refetchTransactions();
                }}
              />
            </View>
          ) : detailLoading ? (
            <View className="mx-4 bg-card rounded-[24px]">
              <LoadingBlock />
            </View>
          ) : (
            <>
              <ExpenseChart pieData={pieData} totalGastos={totalGastos} />

              <MonthlyProgress
                totalGastos={totalGastos}
                progress={progress}
                percentage={percentage}
                hasBudget={hasBudget}
                scopeName={scopeName}
              />

              {showSplit && <PaymentSplitCard split={split} />}

              {/* A limit is for a category in the whole account, so it only makes sense with all of them in view. */}
              {accountId === null && (
                <CategoryLimits
                  rows={limitRows}
                  canEdit={isCurrent}
                  onPressRow={(id) => {
                    setLimitError(null);
                    setEditingId(id);
                  }}
                  onAdd={() => setPicking(true)}
                />
              )}

              <TransactionList
                title="Seus Gastos"
                emptyMessage={EMPTY_TRANSACTIONS_MESSAGE}
                transactions={displayTransactions}
                onPressItem={(id) => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(id) } })}
              />
            </>
          )}
        </View>
      </ScreenScroll>

      <LimitSheet
        visible={editing !== null}
        categoryName={editing?.name ?? ''}
        initialValue={editingLimit !== undefined ? String(editingLimit) : ''}
        hasLimit={editingLimit !== undefined}
        error={limitError}
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
