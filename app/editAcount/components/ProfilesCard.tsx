import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import ProfileAvatar from '@/app/components/profile/ProfileAvatar';
import ProfileFormModal from '@/app/components/profile/ProfileFormModal';
import PickerSheet from '@/app/components/ui/PickerSheet';
import DeleteProfileModal from '@/app/editAcount/components/DeleteProfileModal';
import { type ManagedProfile } from '@/db/profiles';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import {
  ADD_PROFILE_LABEL,
  MODAL_HANDOFF_MS,
  PROFILE_LIMIT_HINT,
  PROFILE_MENU_ACCESSIBILITY,
  PROFILE_MENU_DELETE,
  PROFILE_MENU_RENAME,
  PROFILE_OPEN_ACCESSIBILITY,
  PROFILE_OPEN_LABEL,
  PROFILE_RENAMED_TOAST,
  PROFILES_CARD_EMPTY,
  PROFILES_CARD_TEXT,
  PROFILES_CARD_TITLE,
  PROFILES_COUNT_LABEL,
} from '@/types/profiles/profiles-type';
import { canAddProfile } from '@/utils/profiles';

const RENAME_ID = 'rename';
const DELETE_ID = 'delete';

// The profiles of other people the account cares for: open one, rename it, delete it, or add another. It is part of the
// account (Perfil), not of the profile that is open.
export default function ProfilesCard() {
  const colors = useColors();
  const { showToast } = useFeedback();
  const { profiles, switchTo, openCreate } = useProfiles();

  // The profile whose menu is open, and the one being renamed or deleted. The target stays set while its dialog fades
  // out (the dialog has its own flag), so the text in it does not change on the way out.
  const [menuFor, setMenuFor] = useState<ManagedProfile | null>(null);
  const [target, setTarget] = useState<ManagedProfile | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleMenuChoice = (id: string | number) => {
    const chosen = menuFor;
    setMenuFor(null);
    if (!chosen) return;
    setTarget(chosen);
    // The dialog opens after the sheet is gone: a Modal opened while another one closes is dropped by iOS.
    setTimeout(() => (id === RENAME_ID ? setRenaming(true) : setDeleting(true)), MODAL_HANDOFF_MS);
  };

  const canAdd = canAddProfile(profiles.length);

  return (
    <View className="bg-card rounded-[24px] p-5 mb-4 shadow-lg shadow-primary/10 elevation-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center">
          <Icon name="group" size={16} color={colors.primary.DEFAULT} />
        </View>
        <Text className="text-[15px] font-bold text-ink">{PROFILES_CARD_TITLE}</Text>
      </View>

      <Text className="text-[13px] leading-[19px] text-muted">{PROFILES_CARD_TEXT}</Text>

      <View className="mt-3.5">
        {profiles.length === 0 && <Text className="text-[13px] text-muted py-2">{PROFILES_CARD_EMPTY}</Text>}
        {profiles.map((profile, i) => (
          <View
            key={profile.id}
            className="flex-row items-center gap-3 min-h-[64px]"
            style={{ borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}
          >
            <ProfileAvatar name={profile.name} size={40} managed />
            <Text numberOfLines={1} className="flex-1 text-[15px] font-bold text-ink">{profile.name}</Text>
            <TouchableOpacity
              onPress={() => switchTo(profile.id)}
              activeOpacity={0.8}
              accessibilityLabel={PROFILE_OPEN_ACCESSIBILITY(profile.name)}
              className="h-10 px-4 rounded-[14px] bg-surface items-center justify-center"
            >
              <Text className="text-[13px] font-bold text-primary">{PROFILE_OPEN_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMenuFor(profile)}
              activeOpacity={0.7}
              accessibilityLabel={PROFILE_MENU_ACCESSIBILITY(profile.name)}
              className="w-11 h-11 -mr-2 rounded-full items-center justify-center"
            >
              <Icon name="more-vert" size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {canAdd ? (
        <>
          <TouchableOpacity
            onPress={openCreate}
            activeOpacity={0.8}
            className="mt-3 h-12 rounded-2xl flex-row items-center justify-center gap-1.5"
            style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.subtle }}
          >
            <Icon name="add" size={18} color={colors.primary.DEFAULT} />
            <Text className="text-[14px] font-bold text-primary">{ADD_PROFILE_LABEL}</Text>
          </TouchableOpacity>
          <Text className="text-xs text-muted text-center mt-2">{PROFILES_COUNT_LABEL(profiles.length)}</Text>
        </>
      ) : (
        <Text className="text-xs leading-[17px] text-muted mt-3">{PROFILE_LIMIT_HINT}</Text>
      )}

      <PickerSheet
        visible={menuFor !== null}
        title={menuFor?.name ?? ''}
        options={[
          { id: RENAME_ID, name: PROFILE_MENU_RENAME, icon: 'edit', color: colors.primary.DEFAULT },
          { id: DELETE_ID, name: PROFILE_MENU_DELETE, icon: 'delete-outline', color: colors.expense },
        ]}
        selectedId={null}
        onSelect={handleMenuChoice}
        onClose={() => setMenuFor(null)}
      />
      <ProfileFormModal
        visible={renaming}
        profile={target}
        onClose={() => setRenaming(false)}
        onSaved={() => {
          setRenaming(false);
          showToast(PROFILE_RENAMED_TOAST);
        }}
      />
      <DeleteProfileModal visible={deleting} profile={target} onClose={() => setDeleting(false)} />
    </View>
  );
}
