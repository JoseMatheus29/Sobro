import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useColors } from '@/hooks/useColors';
import {
  ConfirmDialogProps,
  DEFAULT_CANCEL_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DIALOG_DIM_COLOR,
  feedbackStyles,
} from '@/types/components/feedback/feedback-type';

export default function ConfirmDialog({ request, onAnswer }: ConfirmDialogProps) {
  const colors = useColors();
  const destructive = !!request?.destructive;
  const styles = feedbackStyles(colors);
  const look = destructive ? styles.error : styles.info;

  return (
    <Modal visible={!!request} transparent animationType="fade" onRequestClose={() => onAnswer(false)}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: DIALOG_DIM_COLOR }}>
        <View className="w-full rounded-3xl bg-card p-6">
          <View className="w-12 h-12 rounded-[14px] items-center justify-center mb-4" style={{ backgroundColor: look.tint }}>
            <Icon name={destructive ? 'delete-outline' : 'help-outline'} size={24} color={look.color} />
          </View>
          <Text className="text-lg font-bold text-ink">{request?.title}</Text>
          {request?.message ? <Text className="text-sm text-muted mt-1.5 leading-5">{request.message}</Text> : null}

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={() => onAnswer(false)}
              activeOpacity={0.8}
              className="flex-1 h-12 rounded-2xl bg-surface items-center justify-center"
            >
              <Text className="text-[15px] font-bold text-ink">{request?.cancelLabel ?? DEFAULT_CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onAnswer(true)}
              activeOpacity={0.85}
              className="flex-1 h-12 rounded-2xl items-center justify-center"
              style={{ backgroundColor: destructive ? colors.expense : colors.primary.DEFAULT }}
            >
              <Text className="text-[15px] font-bold text-white">{request?.confirmLabel ?? DEFAULT_CONFIRM_LABEL}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
