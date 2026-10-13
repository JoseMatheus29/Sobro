import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import { DIALOG_DIM_COLOR } from '@/types/components/feedback/feedback-type';
import { PICKER_CLOSE_LABEL, PICKER_MAX_HEIGHT, PickerSheetProps } from '@/types/components/ui/pickerSheet-type';

// Bottom sheet with a list of choices (category, account...). Picking one closes it.
export default function PickerSheet({ visible, title, options, selectedId, onSelect, onClose }: PickerSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: DIALOG_DIM_COLOR }}>
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={PICKER_CLOSE_LABEL} />
        <View
          className="bg-card rounded-t-[28px] px-5 pt-2.5"
          style={{ paddingBottom: insets.bottom + 20, maxHeight: PICKER_MAX_HEIGHT }}
        >
          <View className="items-center">
            <View className="w-10 h-1 rounded-full bg-surface-dark" />
          </View>
          <Text className="text-lg font-bold text-ink mt-3.5 mb-1.5">{title}</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const active = option.id === selectedId;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => onSelect(option.id)}
                  activeOpacity={0.7}
                  accessibilityState={{ selected: active }}
                  className="h-[60px] flex-row items-center gap-3.5"
                >
                  <View
                    className="w-10 h-10 rounded-[14px] items-center justify-center"
                    style={{ backgroundColor: `${option.color}1F` }}
                  >
                    <Icon name={option.icon} size={20} color={option.color} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base text-ink ${active ? 'font-bold' : 'font-medium'}`}>{option.name}</Text>
                    {option.sub ? <Text className="text-xs text-muted mt-0.5">{option.sub}</Text> : null}
                  </View>
                  {active && <Icon name="check" size={22} color={colors.primary.DEFAULT} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
