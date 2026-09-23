import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { createCard, updateCard, type CardRecord } from '@/db/cards';

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
  onClose: () => void;
  onSaved: () => void;
}

export default function CardFormModal({ visible, initialCard, onClose, onSaved }: CardFormModalProps) {
  const db = useSQLiteContext();
  const isEditing = !!initialCard;

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [startingBalance, setStartingBalance] = useState('');
  const [palette, setPalette] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initialCard) {
      setName(initialCard.name);
      setNumber(initialCard.number);
      setPalette(
        COLOR_OPTIONS.find((opt) => opt.color === initialCard.color) ?? {
          color: initialCard.color,
          lightColor: initialCard.lightColor,
        }
      );
    } else {
      setName('');
      setNumber('');
      setStartingBalance('');
      setPalette(COLOR_OPTIONS[0]);
    }
  }, [visible, initialCard]);

  const handleSave = async () => {
    if (!name.trim() || !number.trim()) return;
    setSaving(true);
    if (isEditing && initialCard) {
      await updateCard(db, initialCard.id, {
        name: name.trim(),
        number: number.trim(),
        color: palette.color,
        lightColor: palette.lightColor,
      });
    } else {
      await createCard(db, {
        name: name.trim(),
        number: number.trim(),
        color: palette.color,
        lightColor: palette.lightColor,
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
          <Text className="text-[15px] font-bold text-[#1A2B4A] mb-4">
            {isEditing ? 'Editar conta' : 'Nova conta'}
          </Text>

          <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">Nome</Text>
          <TextInput
            className="bg-[#F7F9FC] rounded-[14px] border-[1.5px] border-[#E8EEF5] px-3.5 h-[50px] text-[14px] text-[#1A2B4A] mb-3.5"
            placeholder="Ex: Nubank"
            placeholderTextColor="#C0CCDA"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">
            Últimos dígitos
          </Text>
          <TextInput
            className="bg-[#F7F9FC] rounded-[14px] border-[1.5px] border-[#E8EEF5] px-3.5 h-[50px] text-[14px] text-[#1A2B4A] mb-3.5"
            placeholder="0000"
            placeholderTextColor="#C0CCDA"
            value={number}
            onChangeText={setNumber}
            keyboardType="number-pad"
            maxLength={4}
          />

          {!isEditing && (
            <>
              <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-1.5">
                Saldo inicial (opcional)
              </Text>
              <TextInput
                className="bg-[#F7F9FC] rounded-[14px] border-[1.5px] border-[#E8EEF5] px-3.5 h-[50px] text-[14px] text-[#1A2B4A] mb-3.5"
                placeholder="0,00"
                placeholderTextColor="#C0CCDA"
                value={startingBalance}
                onChangeText={setStartingBalance}
                keyboardType="numeric"
              />
            </>
          )}

          <Text className="text-[11px] font-bold text-[#7998CD] tracking-[0.8px] uppercase mb-2">Cor</Text>
          <View className="flex-row flex-wrap gap-2.5 mb-5">
            {COLOR_OPTIONS.map((opt) => {
              const active = palette.color === opt.color;
              return (
                <TouchableOpacity
                  key={opt.color}
                  onPress={() => setPalette(opt)}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: opt.color, borderWidth: active ? 2 : 0, borderColor: '#1A2B4A' }}
                />
              );
            })}
          </View>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-[#F7F9FC]">
              <Text className="text-[#718096] font-semibold text-sm">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim() || !number.trim() || saving}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: !name.trim() || !number.trim() || saving ? '#C0CCDA' : '#3161B2' }}
            >
              <Text className="text-white font-semibold text-sm">{saving ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
