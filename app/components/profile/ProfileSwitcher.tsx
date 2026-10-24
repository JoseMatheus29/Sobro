import React from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

import ProfileAvatar from '@/app/components/profile/ProfileAvatar';
import { useProfile } from '@/db/hooks';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { DIALOG_DIM_COLOR } from '@/types/components/feedback/feedback-type';
import { WEB_COLUMN_MAX_WIDTH } from '@/types/components/ui/webFrame-type';
import {
  ADD_PROFILE_LABEL,
  MODAL_HANDOFF_MS,
  PROFILE_LIMIT_HINT,
  PROFILES_COUNT_SHORT,
  SWITCHER_CLOSE_LABEL,
  SWITCHER_MANAGED_SECTION,
  SWITCHER_OWN_SECTION,
  SWITCHER_TEXT,
  SWITCHER_TITLE,
  type ProfileSwitcherProps,
} from '@/types/profiles/profiles-type';
import { canAddProfile } from '@/utils/profiles';

// The sheet that changes whose finances are on screen: the person's own, or one of the profiles they care for. Choosing
// one closes the sheet and goes to that profile's Home.
export default function ProfileSwitcher({ visible, onClose }: ProfileSwitcherProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const { profiles, active, switchTo, openCreate } = useProfiles();
  const ownName = profile?.name ?? '';

  const choose = (id: string | null) => {
    onClose();
    switchTo(id);
  };

  const handleAdd = () => {
    onClose();
    setTimeout(openCreate, MODAL_HANDOFF_MS);
  };

  const canAdd = canAddProfile(profiles.length);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={{ backgroundColor: DIALOG_DIM_COLOR }}>
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel={SWITCHER_CLOSE_LABEL} />
        <View
          className="bg-card rounded-t-[28px] px-4 pt-2.5"
          style={{
            paddingBottom: insets.bottom + 24,
            maxHeight: '85%',
            width: '100%',
            maxWidth: WEB_COLUMN_MAX_WIDTH,
            alignSelf: 'center',
          }}
        >
          <View className="items-center">
            <View className="w-10 h-1 rounded-full bg-surface-dark" />
          </View>
          <Text className="text-lg font-bold text-ink mt-3.5 mx-2">{SWITCHER_TITLE}</Text>
          <Text className="text-[13px] leading-[19px] text-muted mt-1 mb-4 mx-2">{SWITCHER_TEXT}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text className="text-[11px] font-bold tracking-[0.8px] uppercase text-muted mx-2 mb-1.5">{SWITCHER_OWN_SECTION}</Text>
            <TouchableOpacity
              onPress={() => choose(null)}
              activeOpacity={0.7}
              accessibilityState={{ selected: active === null }}
              className="flex-row items-center gap-3 min-h-[64px] px-3 py-2.5 rounded-[18px]"
              style={{ backgroundColor: active === null ? colors.surface.DEFAULT : 'transparent' }}
            >
              <ProfileAvatar name={ownName} size={40} managed={false} />
              <Text numberOfLines={1} className="flex-1 text-base font-bold text-ink">{ownName}</Text>
              {active === null && <SelectedMark />}
            </TouchableOpacity>

            {profiles.length > 0 && (
              <Text className="text-[11px] font-bold tracking-[0.8px] uppercase text-muted mx-2 mt-4 mb-1.5">
                {SWITCHER_MANAGED_SECTION}
              </Text>
            )}
            {profiles.map((managed) => {
              const selected = active?.id === managed.id;
              return (
                <TouchableOpacity
                  key={managed.id}
                  onPress={() => choose(managed.id)}
                  activeOpacity={0.7}
                  accessibilityState={{ selected }}
                  className="flex-row items-center gap-3 min-h-[60px] px-3 py-2 rounded-[18px]"
                  style={{ backgroundColor: selected ? colors.surface.DEFAULT : 'transparent' }}
                >
                  <ProfileAvatar name={managed.name} size={40} managed />
                  <Text numberOfLines={1} className="flex-1 text-base font-bold text-ink">{managed.name}</Text>
                  {selected ? <SelectedMark /> : <Icon name="chevron-right" size={20} color={colors.muted} />}
                </TouchableOpacity>
              );
            })}

            <View className="h-px bg-line mx-2 my-2" />
            {canAdd ? (
              <TouchableOpacity onPress={handleAdd} activeOpacity={0.7} className="flex-row items-center gap-3 min-h-[60px] px-3 py-2 rounded-[18px]">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.subtle }}
                >
                  <Icon name="add" size={22} color={colors.primary.DEFAULT} />
                </View>
                <Text className="flex-1 text-[15px] font-bold text-primary">{ADD_PROFILE_LABEL}</Text>
                <Text className="text-xs text-muted">{PROFILES_COUNT_SHORT(profiles.length)}</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs leading-[17px] text-muted mx-2 my-2">{PROFILE_LIMIT_HINT}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// The round check at the end of the profile that is open.
function SelectedMark() {
  const colors = useColors();
  return (
    <View className="w-6 h-6 rounded-full items-center justify-center" style={{ backgroundColor: colors.buttonGradient[0] }}>
      <Icon name="check" size={16} color="#FFFFFF" />
    </View>
  );
}
