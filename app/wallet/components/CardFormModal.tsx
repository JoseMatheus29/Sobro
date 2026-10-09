import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { palette } from '@/constants/palette';
import { createCard, updateCard, type CardRecord } from '@/db/cards';
import {
  CANCEL_LABEL,
  COLOR_LABEL,
  DELETE_ACCOUNT_LABEL,
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
} from '../wallet-type';

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
  const db = useSQLiteContext();
  const isEditing = !!initialCard;

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [cardTheme, setCardTheme] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, initialCard]);

  const canSave = name.trim() !== '' && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    if (isEditing && initialCard) {
      await updateCard(db, initialCard.id, {
        name: name.trim(),
        number: number.trim(),
        color: cardTheme.color,
        lightColor: cardTheme.lightColor,
      });
    } else {
      await createCard(db, {
        name: name.trim(),
        number: number.trim(),
        color: cardTheme.color,
        lightColor: cardTheme.lightColor,
        startingBalance: startingBalance ? Number(startingBalance.replace(',', '.')) : 0,
      });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-white rounded-[24px] p-5 w-full">
          <Text className="text-[15px] font-bold text-ink mb-4">
            {isEditing ? EDIT_ACCOUNT_TITLE : NEW_ACCOUNT_TITLE}
          </Text>

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">{NAME_LABEL}</Text>
          <TextInput
            className="bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5"
            placeholder={NAME_PLACEHOLDER}
            placeholderTextColor={palette.subtle}
            value={name}
            onChangeText={setName}
          />

          <Text className="text-[11px] font-bold text-primary-lighter tracking-[0.8px] uppercase mb-1.5">
            {NUMBER_LABEL}
          </Text>
          <TextInput
            className="bg-canvas rounded-[14px] border-[1.5px] border-line px-3.5 h-[50px] text-[14px] text-ink mb-3.5"
            placeholder={NUMBER_PLACEHOLDER}
            placeholderTextColor={palette.subtle}
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
                placeholderTextColor={palette.subtle}
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
                  style={{ backgroundColor: opt.color, borderWidth: active ? 2 : 0, borderColor: palette.ink }}
                />
              );
            })}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
              <Text className="text-muted font-semibold text-sm">{CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!canSave}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: canSave ? palette.primary.DEFAULT : palette.surface.dark }}
            >
              <Text className="text-white font-semibold text-sm">{saving ? SAVING_LABEL : SAVE_LABEL}</Text>
            </TouchableOpacity>
          </View>

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
