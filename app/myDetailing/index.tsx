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
import { categoriesForType } from '@/utils/transactionForm';
import AccountFilter from '@/app/myDetailing/components/AccountFilter';
import CategorySection from '@/app/myDetailing/components/CategorySection';
import DayGroupedList from '@/app/myDetailing/components/DayGroupedList';
import LimitSheet from '@/app/myDetailing/components/LimitSheet';
import MonthlyProgress from '@/app/myDetailing/components/MonthlyProgress';
import PaymentSplitCard from '@/app/myDetailing/components/PaymentSplitCard';
import { setCategoryBudgetFrom } from '@/db/categoryBudgets';
import { notifyDataChanged } from '@/db/events';
import { useBudgetEntries, useCards, useCategories, useCategoryBudgets, useTransactions } from '@/db/hooks';
import { spendingByCategory, spendingByPayment } from '@/utils/spending';
import { budgetForMonth } from '@/utils/budget';
import { limitsForMonth } from '@/utils/categoryBudget';
import { buildCategoryRows } from '@/utils/categoryRows';
import { dayOf } from '@/utils/invoice';
import { currentMonthKey } from '@/utils/month';
import { errorMessage } from '@/utils/apiErrors';
import { type ToastOptions } from '@/types/components/feedback/feedback-type';
import { invoiceTagOf } from '@/utils/invoiceTag';
import { recurrenceBadge } from '@/utils/recurrence';
import { withoutTransfers } from '@/utils/transfer';
import {
  EMPTY_TRANSACTIONS_MESSAGE,
  LIMIT_FAILED_MESSAGE,
  LIMIT_INVALID_TOAST,
  LIMIT_PICKER_TITLE,
  LIMIT_REMOVED_TOAST,
  LIMIT_SAVED_TOAST,
} from '@/types/myDetailing/myDetailing-type';

export default function MyDetailing() {
  const router = useRouter();
  const { showToast } = useFeedback();
  const { month, isCurrent } = useSelectedMonth();

  const { transactions, loading: detailLoading, error: detailError, refetch: refetchTransactions } = useTransactions({ spendingMonth: month });
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

  // How the spending was paid: only worth showing when at least some of the expenses say how.
  const split = spendingByPayment(scoped);
  const showSplit = split.slices.some((slice) => slice.kind !== 'other');

  const budget = budgetForMonth(budgetEntries, month);
  const hasBudget = budget !== null && budget > 0;
  const progress = hasBudget ? Math.min(totalGastos / budget, 1) : 0;
  const percentage = Math.round(progress * 100);

  // Spending limits per category: the ones in force in the month shown, beside what was spent. A limit is for a category
  // in the whole account, so with one account in view the categories come without it.
  const limits = limitsForMonth(limitEntries, month);
  const expenseCategories = categoriesForType(categories, 'expense');
  const categoryRows = buildCategoryRows(categoryTotals, accountId === null ? limits : {}, expenseCategories);

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
      day: dayOf(t.occurredAt),
      amount: t.amount,
      category: t.categoryName,
      categoryColor: t.categoryColor,
      type: t.type,
      badge: t.recurrence ? recurrenceBadge(t.recurrence) : undefined,
      planned: t.planned,
      // The invoice a purchase on credit goes into: the day is the purchase's, and the month it counts in is the invoice's.
      tag: invoiceTagOf(t, cards),
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
              <MonthlyProgress
                totalGastos={totalGastos}
                progress={progress}
                percentage={percentage}
                hasBudget={hasBudget}
                budget={budget}
                scopeName={scopeName}
              />

              <CategorySection
                rows={categoryRows}
                total={totalGastos}
                showLimits={accountId === null}
                canEdit={isCurrent}
                onPressRow={(id) => {
                  setLimitError(null);
                  setEditingId(id);
                }}
                onAddLimit={() => setPicking(true)}
              />

              {showSplit && <PaymentSplitCard split={split} />}

              <DayGroupedList
                transactions={displayTransactions}
                emptyMessage={EMPTY_TRANSACTIONS_MESSAGE}
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
