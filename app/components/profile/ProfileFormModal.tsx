import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { fieldErrors } from '@/api/errors';
import Field from '@/app/components/ui/Field';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { useSaveKey } from '@/hooks/useSaveKey';
import { DIALOG_MAX_WIDTH } from '@/types/components/feedback/feedback-type';
import {
  NEW_PROFILE_NOTE,
  NEW_PROFILE_TEXT,
  NEW_PROFILE_TITLE,
  PROFILE_CANCEL_LABEL,
  PROFILE_CREATE_LABEL,
  PROFILE_CREATING_LABEL,
  PROFILE_NAME_LABEL,
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_NAME_PLACEHOLDER,
  PROFILE_NAME_REQUIRED,
  PROFILE_RENAME_LABEL,
  PROFILE_RENAMING_LABEL,
  PROFILE_SAVE_FAILED_MESSAGE,
  RENAME_PROFILE_TITLE,
  type ProfileFormModalProps,
} from '@/types/profiles/profiles-type';
import { errorMessage } from '@/utils/apiErrors';

// Makes a profile (the name is all it takes) or renames one. An error shows inside the dialog: a toast would be
// drawn behind the Modal.
export default function ProfileFormModal({ visible, profile, onClose, onSaved }: ProfileFormModalProps) {
  const colors = useColors();
  const { profiles, create, rename } = useProfiles();
  const saveKey = useSaveKey();
  const renaming = profile !== null;

  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(profile?.name ?? '');
    setError(undefined);
    setBusy(false);
    saveKey.clear();
  }, [visible, profile, saveKey]);

  const handleSave = async () => {
    if (busy) return;
    const text = name.trim();
    if (!text) {
      setError(PROFILE_NAME_REQUIRED);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      const saved = renaming ? await rename(profile.id, text) : await create(text, saveKey.keyFor({ name: text }));
      saveKey.clear();
      onSaved(saved);
    } catch (failure) {
      setError(fieldErrors(failure).name ?? errorMessage(failure, PROFILE_SAVE_FAILED_MESSAGE));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/40 items-center justify-center px-6"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="bg-card rounded-[24px] p-5 w-full" style={{ maxWidth: DIALOG_MAX_WIDTH }}>
          <Text className="text-[17px] font-bold text-ink mb-1.5">{renaming ? RENAME_PROFILE_TITLE : NEW_PROFILE_TITLE}</Text>
          {!renaming && <Text className="text-[13px] leading-[19px] text-muted mb-4">{NEW_PROFILE_TEXT}</Text>}

          <Field
            label={PROFILE_NAME_LABEL}
            placeholder={PROFILE_NAME_PLACEHOLDER}
            value={name}
            onChangeText={setName}
            icon="person-outline"
            autoCapitalize="words"
            maxLength={PROFILE_NAME_MAX_LENGTH}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            error={error}
          />

          {!renaming && (
            <View className="flex-row gap-2.5 p-3 rounded-[14px] bg-surface mb-4">
              <Icon name="info-outline" size={18} color={colors.muted} style={{ marginTop: 1 }} />
              <Text className="flex-1 text-[12.5px] leading-[18px] text-muted">{NEW_PROFILE_NOTE(profiles.length)}</Text>
            </View>
          )}

          <View className="flex-row gap-3 mt-1">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
              <Text className="text-muted font-semibold text-sm">{PROFILE_CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={busy}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: busy ? colors.disabledGradient[0] : colors.buttonGradient[0] }}
            >
              <Text className="text-white font-semibold text-sm">
                {renaming
                  ? busy ? PROFILE_RENAMING_LABEL : PROFILE_RENAME_LABEL
                  : busy ? PROFILE_CREATING_LABEL : PROFILE_CREATE_LABEL}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
