import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { useCategories, useTransactions } from '@/db/hooks';
import { formatMoney, formatShortDate } from '@/utils/format';
import { recurrenceBadge } from '@/utils/recurrence';
import { isTransfer } from '@/utils/transfer';
import { netOf, type TypeFilter } from '@/utils/search';
import CardHorizontal from '@/app/components/cardHorizontal';
import EmptyState from '@/app/components/ui/EmptyState';
import LoadError from '@/app/components/ui/LoadError';
import { CLOSE_LABEL, SHEET_DIM_COLOR, SHEET_TOP_GAP } from '@/types/registrationSpent/registrationSpent-type';
import {
  ALL_CATEGORIES_LABEL,
  CLEAR_LABEL,
  EMPTY_ALL_MESSAGE,
  EMPTY_RESULTS_MESSAGE,
  LIMITED_NOTE,
  MAX_RESULTS,
  MORE_THAN_LABEL,
  RESULTS_LABEL,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PLACEHOLDER,
  SEARCH_TITLE,
  TOTAL_LABEL,
  TYPE_OPTIONS,
} from '@/types/search/search-type';

// A chip of a filter: white, with the active one in the brand blue.
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityState={{ selected: active }}
      className="h-9 px-3.5 rounded-full items-center justify-center mr-2 border"
      style={{
        backgroundColor: active ? colors.buttonGradient[0] : colors.card,
        borderColor: active ? colors.primary.DEFAULT : colors.surface.dark,
      }}
    >
      <Text className="text-[13px] font-bold" style={{ color: active ? '#fff' : colors.muted }}>{label}</Text>
    </TouchableOpacity>
  );
}

// A sheet to find any transaction, in any month: by what was typed, by direction and by category.
export default function SearchSheet() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const filtering = typed.trim() !== '' || type !== 'all' || categoryId !== null;

  // The server does the looking (words in the name, description, category or account, accents and case ignored).
  // With a filter every match is read, so the count and the total are exact; without one only the most recent are
  // asked for, one more than is listed to know whether there are others.
  const {
    transactions: found,
    loading,
    error,
    refetch,
  } = useTransactions({
    q: typed.trim() || undefined,
    type: type === 'all' ? undefined : type,
    categoryId: categoryId ?? undefined,
    limit: filtering ? undefined : MAX_RESULTS + 1,
  });
  const shown = found.slice(0, MAX_RESULTS);

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
            <Icon name="close" size={22} color={colors.primary.DEFAULT} />
          </TouchableOpacity>
          <Text className="text-[17px] font-bold text-ink">{SEARCH_TITLE}</Text>
        </View>

        <View className="mx-5 flex-row items-center bg-card rounded-2xl border-[1.5px] border-line px-3.5 h-[52px]">
          <Icon name="search" size={20} color={colors.subtle} />
          <TextInput
            className="flex-1 ml-2.5 text-[15px] text-ink"
            placeholder={SEARCH_PLACEHOLDER}
            placeholderTextColor={colors.subtle}
            value={text}
            onChangeText={setText}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          {text !== '' && (
            <TouchableOpacity onPress={() => setText('')} accessibilityLabel={CLEAR_LABEL} hitSlop={8}>
              <Icon name="cancel" size={20} color={colors.subtle} />
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
          <Text className="text-xs font-bold text-muted">
            {!filtering && found.length > MAX_RESULTS ? MORE_THAN_LABEL(MAX_RESULTS) : RESULTS_LABEL(found.length)}
          </Text>
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
          {shown.length === 0 && error ? (
            <LoadError error={error} onRetry={() => refetch()} />
          ) : shown.length === 0 && loading ? (
            <ActivityIndicator className="mt-10" size="large" color={colors.primary.DEFAULT} />
          ) : shown.length === 0 ? (
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
