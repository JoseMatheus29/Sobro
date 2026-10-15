import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import InlineError from '@/app/components/ui/InlineError';
import { useColors } from '@/hooks/useColors';
import { useSaveKey } from '@/hooks/useSaveKey';
import { createCategory } from '@/db/categories';
import { notifyDataChanged } from '@/db/events';
import { errorMessage } from '@/utils/apiErrors';
import { CATEGORY_SAVE_FAILED_MESSAGE } from '@/types/registrationSpent/registrationSpent-type';

const ICON_OPTIONS = [
  'shopping-cart', 'home', 'pets', 'flight', 'school', 'fitness-center',
  'local-hospital', 'movie', 'card-giftcard', 'local-cafe', 'build', 'label',
];

const COLOR_OPTIONS = [
  '#E67E22', '#3161B2', '#7998CD', '#A83636', '#9B59B6', '#277F2B',
  '#1ABC9C', '#95A5A6', '#F1C40F', '#E74C3C',
];

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface NewCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export default function NewCategoryModal({ visible, onClose, onCreated }: NewCategoryModalProps) {
  const colors = useColors();
  const saveKey = useSaveKey();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    saveKey.clear();
    setName('');
    setIcon(ICON_OPTIONS[0]);
    setColor(COLOR_OPTIONS[0]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const input = { name: name.trim(), icon, color, bg: hexToRgba(color, 0.12) };
      const id = await createCategory(input, saveKey.keyFor(input));
      notifyDataChanged();
      reset();
      onCreated(id);
    } catch (failure) {
      setError(errorMessage(failure, CATEGORY_SAVE_FAILED_MESSAGE));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View className="flex-1 bg-black/40 items-center justify-center px-6">
        <View className="bg-card rounded-[20px] p-5 w-full">
          <Text className="text-[15px] font-semibold text-ink mb-4">Nova categoria</Text>

          <TextInput
            className="bg-canvas rounded-xl border border-transparent px-3.5 h-[46px] text-[14px] text-ink mb-4"
            placeholder="Nome da categoria"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
          />

          <Text className="text-xs text-muted mb-2">Ícone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {ICON_OPTIONS.map((opt) => {
                const active = icon === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setIcon(opt)}
                    className="w-11 h-11 rounded-xl items-center justify-center"
                    style={{ backgroundColor: active ? hexToRgba(color, 0.12) : colors.surface.DEFAULT }}
                  >
                    <Icon name={opt} size={20} color={active ? color : colors.subtle} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <Text className="text-xs text-muted mb-2">Cor</Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {COLOR_OPTIONS.map((opt) => {
              const active = color === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setColor(opt)}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: opt, borderWidth: active ? 2 : 0, borderColor: colors.ink }}
                />
              );
            })}
          </View>

          <InlineError message={error} />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={handleClose}
              className="flex-1 h-12 rounded-xl items-center justify-center bg-canvas"
            >
              <Text className="text-muted font-semibold text-sm">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!name.trim() || saving}
              className="flex-1 h-12 rounded-xl items-center justify-center"
              style={{ backgroundColor: !name.trim() || saving ? colors.disabledGradient[0] : colors.buttonGradient[0] }}
            >
              <Text className="text-white font-semibold text-sm">{saving ? 'Salvando...' : 'Criar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
