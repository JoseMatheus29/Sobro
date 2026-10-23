import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { DIALOG_DIM_COLOR, DIALOG_MAX_WIDTH } from '@/types/components/feedback/feedback-type';
import {
  DATE_PICKER_CANCEL_LABEL,
  DATE_PICKER_CONFIRM_LABEL,
  DATE_PICKER_INVALID_MESSAGE,
  DATE_PICKER_TITLE,
  type DatePickerProps,
} from '@/types/components/ui/datePicker-type';
import { fromDateInputValue, toDateInputValue } from '@/utils/dateInput';

// The browser's version: `@react-native-community/datetimepicker` draws nothing on the web, so the day is chosen
// in a dialog with the browser's own date field (typed with the keyboard or from its calendar). Same contract as
// the phone's: draw it to open it, and stop drawing it in `onChange`.
export default function DatePicker({ value, maximumDate, onChange }: DatePickerProps) {
  const colors = useColors();
  const [text, setText] = useState(toDateInputValue(value));
  const max = maximumDate ? toDateInputValue(maximumDate) : undefined;
  const chosen = fromDateInputValue(text, value);
  // Both are 'YYYY-MM-DD', so comparing the texts compares the days.
  const valid = chosen !== null && (max === undefined || text <= max);

  const confirm = () => {
    if (chosen && valid) onChange(chosen);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => onChange(null)}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: DIALOG_DIM_COLOR }}>
        <Pressable
          accessibilityLabel={DATE_PICKER_CANCEL_LABEL}
          onPress={() => onChange(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="w-full rounded-3xl bg-card p-6" style={{ maxWidth: DIALOG_MAX_WIDTH }}>
          <Text className="text-lg font-bold text-ink">{DATE_PICKER_TITLE}</Text>

          <input
            type="date"
            aria-label={DATE_PICKER_TITLE}
            value={text}
            max={max}
            autoFocus
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') confirm();
            }}
            style={{
              marginTop: 16,
              width: '100%',
              height: 52,
              boxSizing: 'border-box',
              padding: '0 14px',
              borderRadius: 16,
              border: `1.5px solid ${valid ? colors.line : colors.expense}`,
              backgroundColor: colors.canvas,
              color: colors.ink,
              fontSize: 16,
              fontFamily: 'inherit',
            }}
          />
          {!valid && (
            <Text className="text-[12px] mt-1.5" style={{ color: colors.expense }}>
              {DATE_PICKER_INVALID_MESSAGE}
            </Text>
          )}

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => onChange(null)}
              activeOpacity={0.8}
              className="flex-1 h-12 rounded-2xl bg-surface items-center justify-center"
            >
              <Text className="text-[15px] font-bold text-ink">{DATE_PICKER_CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirm}
              disabled={!valid}
              activeOpacity={0.85}
              className="flex-1 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: valid ? colors.buttonGradient[0] : colors.disabledGradient[0] }}
            >
              <Text className="text-[15px] font-bold text-white">{DATE_PICKER_CONFIRM_LABEL}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
