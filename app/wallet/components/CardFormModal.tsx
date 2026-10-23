import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Switch, View, Text, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import InlineError from '@/app/components/ui/InlineError';
import Stepper from '@/app/components/ui/Stepper';
import { notifyDataChanged } from '@/db/events';
import { useColors } from '@/hooks/useColors';
import { DIALOG_MAX_WIDTH } from '@/types/components/feedback/feedback-type';
import { useSaveKey } from '@/hooks/useSaveKey';
import { createCard, getCardUsage, updateCard, type CardCredit, type CardRecord } from '@/db/cards';
import { roundAmount } from '@/utils/apiInput';
import { errorMessage } from '@/utils/apiErrors';
import { tint } from '@/utils/color';
import {
  CANCEL_LABEL,
  COLOR_LABEL,
  CREDIT_CLOSING_LABEL,
  CREDIT_DAYS_HINT,
  CREDIT_DUE_LABEL,
  CREDIT_HINT,
  CREDIT_LABEL,
  CREDIT_LIMIT_LABEL,
  CREDIT_LIMIT_PLACEHOLDER,
  DEFAULT_CLOSING_DAY,
  DEFAULT_DUE_DAY,
  INVALID_LIMIT_MESSAGE,
  MAX_CARD_DAY,
  MIN_CARD_DAY,
  DELETE_ACCOUNT_LABEL,
  DELETE_ACCOUNT_WARNING,
  INVALID_BALANCE_MESSAGE,
  SAVE_FAILED_MESSAGE,
  EDIT_ACCOUNT_TITLE,
  LAST_ACCOUNT_HINT,
  NAME_LABEL,
  NAME_PLACEHOLDER,
  NEW_ACCOUNT_TITLE,
  NUMBER_LABEL,
  NUMBER_PLACEHOLDER,
  SAVE_LABEL,
  SAVING_LABEL,
  STARTING_BALANCE_LABEL,
  STARTING_BALANCE_PLACEHOLDER,
} from '@/types/wallet/wallet-type';

const COLOR_OPTIONS: { color: string; lightColor: string }[] = [
  { color: '#3161B2', lightColor: '#4A74BB' },
  { color: '#254E8F', lightColor: '#3161B2' },
  { color: '#36A83A', lightColor: '#5FC964' },
  { color: '#A83636', lightColor: '#C0514A' },
  { color: '#9B59B6', lightColor: '#B983CC' },
  { color: '#E67E22', lightColor: '#F0A24F' },
];

interface CardFormModalProps {
  visible: boolean;
  initialCard?: CardRecord | null;
  /** An account can only be deleted while there is another one left. */
  canDelete: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDelete: (card: CardRecord) => void;
}

// Creates or edits an account: a place where the money is (a bank, a card, cash).
export default function CardFormModal({ visible, initialCard, canDelete, onClose, onSaved, onDelete }: CardFormModalProps) {
  const colors = useColors();
  const { height: windowHeight } = useWindowDimensions();
  const saveKey = useSaveKey();
  const isEditing = !!initialCard;

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [cardTheme, setCardTheme] = useState(COLOR_OPTIONS[0]);
  // The credit card: its limit as typed, and the days its invoice closes and falls due.
  const [hasCredit, setHasCredit] = useState(false);
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState(DEFAULT_CLOSING_DAY);
  const [dueDay, setDueDay] = useState(DEFAULT_DUE_DAY);
  const [saving, setSaving] = useState(false);
  // Inside the dialog: a toast would be drawn behind the Modal.
  const [error, setError] = useState<string | null>(null);
  // What deleting this account would take with it, to warn before the delete button is pressed.
  const [usage, setUsage] = useState<{ transactions: number; recurrences: number } | null>(null);

  useEffect(() => {
    if (!visible || !initialCard) {
      setUsage(null);
      return;
    }
    let cancelled = false;
    getCardUsage(initialCard.id)
      .then((found) => {
        if (!cancelled) setUsage(found);
      })
      .catch(() => {
        // Only a warning: the delete itself asks again, with the count, before it goes ahead.
      });
    return () => {
      cancelled = true;
    };
  }, [visible, initialCard]);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    saveKey.clear();
    if (initialCard) {
      setName(initialCard.name);
      setNumber(initialCard.number);
      setHasCredit(initialCard.credit !== null);
      setLimit(initialCard.credit?.limit != null ? String(initialCard.credit.limit).replace('.', ',') : '');
      setClosingDay(initialCard.credit?.closingDay ?? DEFAULT_CLOSING_DAY);
      setDueDay(initialCard.credit?.dueDay ?? DEFAULT_DUE_DAY);
      setCardTheme(
        COLOR_OPTIONS.find((opt) => opt.color === initialCard.color) ?? {
          color: initialCard.color,
          lightColor: initialCard.lightColor,
        }
      );
    } else {
      setName('');
      setNumber('');
      setStartingBalance('');
      setHasCredit(false);
      setLimit('');
      setClosingDay(DEFAULT_CLOSING_DAY);
      setDueDay(DEFAULT_DUE_DAY);
      setCardTheme(COLOR_OPTIONS[0]);
    }
  }, [visible, initialCard, saveKey]);

  const canSave = name.trim() !== '' && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const balance = startingBalance.trim() ? Number(startingBalance.replace(',', '.')) : 0;
    if (!isEditing && !Number.isFinite(balance)) {
      setError(INVALID_BALANCE_MESSAGE);
      return;
    }
    const creditLimit = limit.trim() ? Number(limit.replace(',', '.')) : null;
    if (hasCredit && creditLimit !== null && (!Number.isFinite(creditLimit) || creditLimit < 0)) {
      setError(INVALID_LIMIT_MESSAGE);
      return;
    }
    const credit: CardCredit | null = hasCredit
      ? { limit: creditLimit === null ? null : roundAmount(creditLimit), closingDay, dueDay }
      : null;
    setError(null);
    setSaving(true);
    try {
      if (isEditing && initialCard) {
        await updateCard(initialCard.id, {
          name: name.trim(),
          number: number.trim(),
          color: cardTheme.color,
          lightColor: cardTheme.lightColor,
          // Only touched when there is something to say: turning it off is the one case that sends null.
          ...(credit || initialCard.credit ? { credit } : {}),
        });
      } else {
        const input = {
          name: name.trim(),
          number: number.trim(),
          color: cardTheme.color,
          lightColor: cardTheme.lightColor,
          startingBalance: roundAmount(balance),
          ...(credit ? { credit } : {}),
        };
        await createCard(input, saveKey.keyFor(input));
        saveKey.clear();
      }
      notifyDataChanged();
      onSaved();
    } catch (failure) {
      setError(errorMessage(failure, SAVE_FAILED_MESSAGE));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-card rounded-[24px] p-5 w-full" style={{ maxWidth: DIALOG_MAX_WIDTH }}>
          <Text className="text-[15px] font-bold text-ink mb-4">
            {isEditing ? EDIT_ACCOUNT_TITLE : NEW_ACCOUNT_TITLE}
          </Text>

          <ScrollView
            style={{ maxHeight: windowHeight * 0.72 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">{NAME_LABEL}</Text>
          <TextInput
            className="bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5"
            placeholder={NAME_PLACEHOLDER}
            placeholderTextColor={colors.subtle}
            value={name}
            onChangeText={setName}
          />

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
            {NUMBER_LABEL}
          </Text>
          <TextInput
            className="bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5"
            placeholder={NUMBER_PLACEHOLDER}
            placeholderTextColor={colors.subtle}
            value={number}
            onChangeText={setNumber}
            keyboardType="number-pad"
            maxLength={4}
          />

          {!isEditing && (
            <>
              <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
                {STARTING_BALANCE_LABEL}
              </Text>
              <TextInput
                className="bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5"
                placeholder={STARTING_BALANCE_PLACEHOLDER}
                placeholderTextColor={colors.subtle}
                value={startingBalance}
                onChangeText={setStartingBalance}
                keyboardType="numeric"
              />
            </>
          )}

          <View className="flex-row items-center gap-3 mb-3.5">
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">{CREDIT_LABEL}</Text>
              <Text className="text-xs text-muted mt-0.5">{CREDIT_HINT}</Text>
            </View>
            <Switch
              value={hasCredit}
              onValueChange={setHasCredit}
              trackColor={{ false: colors.surface.dark, true: colors.primary.light }}
              thumbColor={hasCredit ? colors.buttonGradient[0] : '#FFFFFF'}
              accessibilityLabel={CREDIT_LABEL}
            />
          </View>

          {hasCredit && (
            <View className="bg-canvas rounded-[16px] border border-line p-3.5 mb-3.5">
              <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
                {CREDIT_LIMIT_LABEL}
              </Text>
              <TextInput
                className="bg-card rounded-[14px] border-[1.5px] border-line px-3.5 h-[46px] text-[14px] text-ink mb-3"
                placeholder={CREDIT_LIMIT_PLACEHOLDER}
                placeholderTextColor={colors.subtle}
                value={limit}
                onChangeText={setLimit}
                keyboardType="numeric"
              />
              <View className="flex-row gap-2.5">
                <Stepper label={CREDIT_CLOSING_LABEL} value={closingDay} min={MIN_CARD_DAY} max={MAX_CARD_DAY} onChange={setClosingDay} />
                <Stepper label={CREDIT_DUE_LABEL} value={dueDay} min={MIN_CARD_DAY} max={MAX_CARD_DAY} onChange={setDueDay} />
              </View>
              <Text className="text-xs leading-[17px] text-muted mt-3">{CREDIT_DAYS_HINT(closingDay, dueDay)}</Text>
            </View>
          )}

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-2">{COLOR_LABEL}</Text>
          <View className="flex-row flex-wrap gap-2.5 mb-5">
            {COLOR_OPTIONS.map((opt) => {
              const active = cardTheme.color === opt.color;
              return (
                <TouchableOpacity
                  key={opt.color}
                  onPress={() => setCardTheme(opt)}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: opt.color, borderWidth: active ? 2 : 0, borderColor: colors.ink }}
                />
              );
            })}
          </View>

          <InlineError message={error} />

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
              <Text className="text-muted font-semibold text-sm">{CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: canSave ? colors.buttonGradient[0] : colors.disabledGradient[0] }}
            >
              <Text className="text-white font-semibold text-sm">{saving ? SAVING_LABEL : SAVE_LABEL}</Text>
            </TouchableOpacity>
          </View>

          {isEditing && initialCard && canDelete && usage && (usage.transactions > 0 || usage.recurrences > 0) && (
            <View className="flex-row items-start gap-2.5 mt-4 rounded-[14px] p-3" style={{ backgroundColor: tint(colors.expense) }}>
              <Icon name="warning-amber" size={18} color={colors.expense} />
              <Text className="flex-1 text-[12px] leading-[17px] text-ink">
                {DELETE_ACCOUNT_WARNING(usage.transactions, usage.recurrences)}
              </Text>
            </View>
          )}

          {isEditing && initialCard && (
            canDelete ? (
              <TouchableOpacity onPress={() => onDelete(initialCard)} activeOpacity={0.8} className="h-11 mt-3 items-center justify-center">
                <Text className="text-[14px] font-bold text-expense">{DELETE_ACCOUNT_LABEL}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs text-muted text-center mt-4">{LAST_ACCOUNT_HINT}</Text>
            )
          )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
