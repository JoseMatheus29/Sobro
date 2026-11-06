import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import WhatsNewDialog from '@/app/components/whatsNew/WhatsNewDialog';
import { useColors } from '@/hooks/useColors';
import {
  RELEASES,
  REVIEW_RELEASES,
  WHATS_NEW_REVIEW_LABEL,
  WHATS_NEW_REVIEW_TEXT,
  WHATS_NEW_REVIEW_TITLE,
} from '@/types/whatsNew/whatsNew-type';

// "Novidades": opens again what changed in the last updates, for someone who closed it too fast.
export default function WhatsNewCard() {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="auto-awesome" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">{WHATS_NEW_REVIEW_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{WHATS_NEW_REVIEW_TEXT}</Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        className="h-12 mt-4 rounded-2xl flex-row items-center justify-center gap-1.5 border-[1.5px]"
        style={{ backgroundColor: colors.canvas, borderColor: colors.surface.dark }}
      >
        <Icon name="new-releases" size={18} color={colors.primary.DEFAULT} />
        <Text className="text-[14px] font-bold text-primary">{WHATS_NEW_REVIEW_LABEL}</Text>
      </TouchableOpacity>

      <WhatsNewDialog releases={open ? RELEASES.slice(0, REVIEW_RELEASES) : []} onClose={() => setOpen(false)} />
    </View>
  );
}
