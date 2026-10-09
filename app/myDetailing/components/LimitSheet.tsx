import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { palette } from '@/constants/palette';
import { DIALOG_DIM_COLOR } from '../../components/feedback/feedback-type';
import {
  LIMIT_PLACEHOLDER,
  LIMIT_REMOVE_LABEL,
  LIMIT_SAVE_LABEL,
  LIMIT_SHEET_HINT,
  LIMIT_SHEET_TITLE,
  LimitSheetProps,
} from '../myDetailing-type';

// Asks for the limit of one category. It is centered, and makes room for the keyboard when it opens
// (a Modal does not resize with it on Android), so the field is never covered.
export default function LimitSheet({
  visible,
  categoryName,
  initialValue,
  hasLimit,
  onSave,
  onRemove,
  onClose,
}: LimitSheetProps) {
  const [value, setValue] = useState(initialValue);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const amount = Number(value.replace(',', '.'));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        className="flex-1 justify-center px-6"
        style={{ backgroundColor: DIALOG_DIM_COLOR, paddingBottom: keyboardHeight }}
        onPress={onClose}
      >
        <Pressable className="bg-white rounded-[24px] p-5" onPress={() => undefined}>
          <Text className="text-lg font-bold text-ink">{LIMIT_SHEET_TITLE(categoryName)}</Text>

          <View className="flex-row items-center bg-canvas rounded-2xl border-[1.5px] border-line px-3.5 h-[52px] mt-4">
            <Icon name="flag" size={18} color={palette.subtle} />
            <TextInput
              className="flex-1 ml-2.5 text-[15px] text-ink"
              placeholder={LIMIT_PLACEHOLDER}
              placeholderTextColor={palette.subtle}
              value={value}
              onChangeText={setValue}
              keyboardType="numeric"
              autoFocus
            />
          </View>
          <Text className="text-xs text-muted mt-2">{LIMIT_SHEET_HINT}</Text>

          <TouchableOpacity
            onPress={() => onSave(amount)}
            activeOpacity={0.85}
            className="h-12 mt-4 rounded-2xl items-center justify-center bg-primary"
          >
            <Text className="text-[15px] font-bold text-white">{LIMIT_SAVE_LABEL}</Text>
          </TouchableOpacity>

          {hasLimit && (
            <TouchableOpacity onPress={onRemove} activeOpacity={0.8} className="h-11 mt-2 items-center justify-center">
              <Text className="text-[14px] font-bold text-expense">{LIMIT_REMOVE_LABEL}</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
