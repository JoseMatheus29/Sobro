import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { notifyDataChanged } from '@/db/events';
import { deleteTransfer, getTransferLegs, type TransactionRecord } from '@/db/transactions';
import { formatLongDate, formatMoney } from '@/utils/format';
import ArrowBack from '@/app/components/arrowBack';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import ScreenHeader from '@/app/components/ui/ScreenHeader';
import {
  TRANSFER_DATE_LABEL,
  TRANSFER_DELETE_CONFIRM,
  TRANSFER_DELETE_LABEL,
  TRANSFER_DELETED_TOAST,
  TRANSFER_FROM_LABEL,
  TRANSFER_HINT,
  TRANSFER_NOTE_LABEL,
  TRANSFER_TITLE,
  TRANSFER_TO_LABEL,
} from '@/types/detailsSpend/detailsSpend-type';
import { tint } from '@/utils/color';

// What a transfer between accounts looks like in the details: where the money left and where it went.
// There is nothing to edit, because changing one leg would leave the balances wrong; it is deleted and made again.
export default function TransferDetails({ transaction }: { transaction: TransactionRecord }) {
  const colors = useColors();
  const router = useRouter();
  const db = useSQLiteContext();
  const { confirm, showToast } = useFeedback();
  const [legs, setLegs] = useState<TransactionRecord[]>([]);

  const transferId = transaction.transferId;
  useEffect(() => {
    if (transferId == null) return;
    getTransferLegs(db, transferId).then(setLegs);
  }, [db, transferId]);

  const outgoing = legs.find((l) => l.type === 'expense');
  const incoming = legs.find((l) => l.type === 'income');
  const amount = Math.abs(transaction.amount);

  const handleDelete = async () => {
    if (transferId == null || !(await confirm(TRANSFER_DELETE_CONFIRM))) return;
    await deleteTransfer(db, transferId);
    notifyDataChanged();
    showToast(TRANSFER_DELETED_TOAST);
    router.back();
  };

  const rows = [
    { label: TRANSFER_FROM_LABEL, value: outgoing?.cardName ?? '—', icon: 'north-east' },
    { label: TRANSFER_TO_LABEL, value: incoming?.cardName ?? '—', icon: 'south-west' },
    { label: TRANSFER_DATE_LABEL, value: formatLongDate(transaction.occurredAt), icon: 'event' },
    ...(transaction.description ? [{ label: TRANSFER_NOTE_LABEL, value: transaction.description, icon: 'notes' }] : []),
  ];

  return (
    <View className="flex-1 bg-canvas">
      <ScreenHeader title={TRANSFER_TITLE} leftComponent={<ArrowBack />}>
        <View className="items-center">
          <View className="w-14 h-14 rounded-[18px] bg-headerInk/20 items-center justify-center">
            <Icon name="swap-horiz" size={28} color={colors.headerInk} />
          </View>
          <Text className="text-4xl font-extrabold text-headerInk tracking-tight mt-3">{formatMoney(amount)}</Text>
        </View>
      </ScreenHeader>

      <ScrollView className="flex-1 -mt-7" contentContainerClassName="px-5 pb-10" showsVerticalScrollIndicator={false}>
        <View className="bg-card rounded-[20px] border border-surface px-4 shadow-sm shadow-black/5 elevation-2">
          {rows.map((row, i) => (
            <View key={row.label} className={`flex-row items-center gap-3 py-3.5 ${i < rows.length - 1 ? 'border-b border-line' : ''}`}>
              <View className="w-10 h-10 rounded-[14px] bg-surface items-center justify-center">
                <Icon name={row.icon} size={20} color={colors.primary.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-muted">{row.label}</Text>
                <Text className="text-base font-medium text-ink">{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text className="text-xs text-muted text-center mt-3 px-2">{TRANSFER_HINT}</Text>

        <TouchableOpacity
          onPress={handleDelete}
          activeOpacity={0.8}
          className="h-[52px] mt-4 rounded-2xl flex-row items-center justify-center gap-2"
          style={{ backgroundColor: tint(colors.expense) }}
        >
          <Icon name="delete-outline" size={20} color={colors.expense} />
          <Text className="text-[15px] font-bold text-expense">{TRANSFER_DELETE_LABEL}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
