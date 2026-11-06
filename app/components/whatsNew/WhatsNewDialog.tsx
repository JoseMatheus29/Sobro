import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { DIALOG_DIM_COLOR, DIALOG_MAX_WIDTH } from '@/types/components/feedback/feedback-type';
import { useColors } from '@/hooks/useColors';
import { tint } from '@/utils/color';
import { WHATS_NEW_CLOSE_LABEL, WHATS_NEW_TITLE, type Release } from '@/types/whatsNew/whatsNew-type';

interface WhatsNewDialogProps {
  /** Newest first; nothing to show closes it. */
  releases: Release[];
  onClose: () => void;
}

// What is new in the app: a card with one line for each change, over a dimmed screen. With more than one release (someone
// who skipped some) each has its own title.
export default function WhatsNewDialog({ releases, onClose }: WhatsNewDialogProps) {
  const colors = useColors();
  const { height } = useWindowDimensions();
  const several = releases.length > 1;

  return (
    <Modal visible={releases.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: DIALOG_DIM_COLOR }}>
        <View className="w-full rounded-3xl bg-card p-6" style={{ maxWidth: DIALOG_MAX_WIDTH, maxHeight: height * 0.82 }}>
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-[14px] items-center justify-center" style={{ backgroundColor: tint(colors.primary.DEFAULT) }}>
              <Icon name="auto-awesome" size={24} color={colors.primary.DEFAULT} />
            </View>
            <Text className="flex-1 text-lg font-bold text-ink">{WHATS_NEW_TITLE}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
            {releases.map((release) => (
              <View key={release.id} className="mb-2">
                {several && <Text className="text-xs font-bold uppercase tracking-[0.8px] text-subtle mb-2">{release.title}</Text>}
                {release.items.map((item) => (
                  <View key={item.title} className="flex-row gap-3 mb-4">
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: tint(colors.primary.DEFAULT) }}>
                      <Icon name={item.icon} size={18} color={colors.primary.DEFAULT} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-[15px] font-bold text-ink">{item.title}</Text>
                      <Text className="text-[13px] leading-[19px] text-muted mt-0.5">{item.text}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            className="h-12 mt-2 rounded-2xl items-center justify-center"
            style={{ backgroundColor: colors.buttonGradient[0] }}
          >
            <Text className="text-[15px] font-bold text-white">{WHATS_NEW_CLOSE_LABEL}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
