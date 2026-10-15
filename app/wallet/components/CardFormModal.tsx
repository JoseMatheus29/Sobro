import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import InlineError from '@/app/components/ui/InlineError';
import { notifyDataChanged } from '@/db/events';
import { useColors } from '@/hooks/useColors';
import { useSaveKey } from '@/hooks/useSaveKey';
import { createCard, getCardUsage, updateCard, type CardRecord } from '@/db/cards';
import { roundAmount } from '@/utils/apiInput';
import { errorMessage } from '@/utils/apiErrors';
import { tint } from '@/utils/color';
import {
  CANCEL_LABEL,
  COLOR_LABEL,
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
  const saveKey = useSaveKey();
  const isEditing = !!initialCard;

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [cardTheme, setCardTheme] = useState(COLOR_OPTIONS[0]);
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
    setError(null);
    setSaving(true);
    try {
      if (isEditing && initialCard) {
        await updateCard(initialCard.id, {
          name: name.trim(),
          number: number.trim(),
          color: cardTheme.color,
          lightColor: cardTheme.lightColor,
        });
      } else {
        const input = {
          name: name.trim(),
          number: number.trim(),
          color: cardTheme.color,
          lightColor: cardTheme.lightColor,
          startingBalance: roundAmount(balance),
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
        <View className="bg-card rounded-[24px] p-5 w-full">
          <Text className="text-[15px] font-bold text-ink mb-4">
            {isEditing ? EDIT_ACCOUNT_TITLE : NEW_ACCOUNT_TITLE}
          </Text>

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
        </View>
      </View>
    </Modal>
  );
}
