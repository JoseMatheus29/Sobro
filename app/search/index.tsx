import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { useCategories, useTransactions } from '@/db/hooks';
import { formatMoney, formatShortDate } from '@/utils/format';
import { recurrenceBadge } from '@/utils/recurrence';
import { isTransfer } from '@/utils/transfer';
import { netOf, searchTransactions, type TypeFilter } from '@/utils/search';
import CardHorizontal from '../components/cardHorizontal';
import EmptyState from '../components/ui/EmptyState';
import { CLOSE_LABEL, SHEET_DIM_COLOR, SHEET_TOP_GAP } from '../registrationSpent/registrationSpent-type';
import {
  ALL_CATEGORIES_LABEL,
  CLEAR_LABEL,
  EMPTY_ALL_MESSAGE,
  EMPTY_RESULTS_MESSAGE,
  LIMITED_NOTE,
  MAX_RESULTS,
  RESULTS_LABEL,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PLACEHOLDER,
  SEARCH_TITLE,
  TOTAL_LABEL,
  TYPE_OPTIONS,
} from './search-type';

// A chip of a filter: white, with the active one in the brand blue.
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityState={{ selected: active }}
      className="h-9 px-3.5 rounded-full items-center justify-center mr-2 border"
      style={{
        backgroundColor: active ? palette.primary.DEFAULT : '#fff',
        borderColor: active ? palette.primary.DEFAULT : palette.surface.dark,
      }}
    >
      <Text className="text-[13px] font-bold" style={{ color: active ? '#fff' : palette.muted }}>{label}</Text>
    </TouchableOpacity>
  );
}

// A sheet to find any transaction, in any month: by what was typed, by direction and by category.
export default function SearchSheet() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions } = useTransactions({});
  const { categories } = useCategories();

  const [text, setText] = useState('');
  const [typed, setTyped] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // What is looked for follows the typing a moment later, so a long list is not filtered at every key.
  useEffect(() => {
    const timer = setTimeout(() => setTyped(text), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  const found = useMemo(
    () => searchTransactions(transactions, { text: typed, type, categoryId }),
    [transactions, typed, type, categoryId]
  );
  const shown = found.slice(0, MAX_RESULTS);
  const filtering = typed.trim() !== '' || type !== 'all' || categoryId !== null;

  return (
    <View className="flex-1" style={{ backgroundColor: SHEET_DIM_COLOR }}>
      <Pressable
        accessibilityLabel={CLOSE_LABEL}
        onPress={() => router.back()}
        style={{ height: insets.top + SHEET_TOP_GAP }}
      />
      <KeyboardAvoidingView
        className="flex-1 bg-canvas rounded-t-[28px] overflow-hidden"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="items-center pt-2.5">
          <View className="w-10 h-1 rounded-full bg-surface-dark" />
        </View>

        <View className="h-14 items-center justify-center">
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityLabel={CLOSE_LABEL}
            className="absolute left-3 w-11 h-11 rounded-[14px] bg-surface items-center justify-center"
          >
            <Icon name="close" size={22} color={palette.primary.DEFAULT} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink">{SEARCH_TITLE}</Text>
        </View>

        <View className="mx-5 flex-row items-center bg-white rounded-2xl border-[1.5px] border-line px-3.5 h-[52px]">
          <Icon name="search" size={20} color={palette.subtle} />
          <TextInput
            className="flex-1 ml-2.5 text-[15px] text-ink"
            placeholder={SEARCH_PLACEHOLDER}
            placeholderTextColor={palette.subtle}
            value={text}
            onChangeText={setText}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {text !== '' && (
            <TouchableOpacity onPress={() => setText('')} accessibilityLabel={CLEAR_LABEL} hitSlop={8}>
              <Icon name="cancel" size={20} color={palette.subtle} />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row px-5 mt-3">
          {TYPE_OPTIONS.map((option) => (
            <Chip key={option.value} label={option.label} active={type === option.value} onPress={() => setType(option.value)} />
          ))}
        </View>

        <View className="mt-2.5">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            <Chip label={ALL_CATEGORIES_LABEL} active={categoryId === null} onPress={() => setCategoryId(null)} />
            {categories.map((c) => (
              <Chip key={c.id} label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </ScrollView>
        </View>

        <View className="flex-row items-center justify-between px-5 mt-3 mb-2">
          <Text className="text-xs font-bold text-muted">{RESULTS_LABEL(found.length)}</Text>
          {found.length > 0 && filtering && (
            <Text className="text-xs font-bold text-muted">
              {TOTAL_LABEL}: {netOf(found) < 0 ? '-' : '+'} {formatMoney(Math.abs(netOf(found)))}
            </Text>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {shown.length === 0 ? (
            <EmptyState icon="search-off" message={filtering ? EMPTY_RESULTS_MESSAGE : EMPTY_ALL_MESSAGE} />
          ) : (
            shown.map((t) => (
              <CardHorizontal
                key={t.id}
                name={t.name}
                date={formatShortDate(t.occurredAt)}
                amount={t.amount}
                category={t.categoryName}
                icon={t.categoryIcon}
                iconColor={t.categoryColor}
                type={t.type}
                badge={t.recurrence ? recurrenceBadge(t.recurrence) : undefined}
                transfer={isTransfer(t)}
                onPress={() => router.push({ pathname: '/detailsSpend/[id]', params: { id: String(t.id) } })}
              />
            ))
          )}
          {found.length > MAX_RESULTS && (
            <Text className="text-xs text-muted text-center mt-1">{LIMITED_NOTE(MAX_RESULTS)}</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
