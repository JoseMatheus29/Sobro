import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import Field from '@/app/components/ui/Field';
import { useColors } from '@/hooks/useColors';
import { useProfiles } from '@/hooks/useProfiles';
import { DIALOG_MAX_WIDTH } from '@/types/components/feedback/feedback-type';
import { DELETE_CANCEL_LABEL } from '@/types/editAcount/editAcount-type';
import {
  DELETE_PROFILE_FAILED_TITLE,
  DELETE_PROFILE_PASSWORD_HINT,
  DELETE_PROFILE_PASSWORD_LABEL,
  DELETE_PROFILE_PASSWORD_REQUIRED,
  DELETE_PROFILE_SUBMIT,
  DELETE_PROFILE_SUBMITTING,
  DELETE_PROFILE_TEXT,
  DELETE_PROFILE_TITLE,
  type DeleteProfileModalProps,
} from '@/types/profiles/profiles-type';
import { errorToast } from '@/utils/apiErrors';

// Deleting a profile takes everything in it for good, so it asks for the password of the person (the profile has none),
// like deleting the account does. A wrong password shows up inside the dialog: a toast would be drawn behind the Modal.
export default function DeleteProfileModal({ visible, profile, onClose }: DeleteProfileModalProps) {
  const colors = useColors();
  const { remove } = useProfiles();
  const { showToast } = useFeedback();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPassword('');
    setError(undefined);
    setBusy(false);
  }, [visible]);

  if (!profile) return null;

  const handleDelete = async () => {
    if (busy) return;
    if (!password) {
      setError(DELETE_PROFILE_PASSWORD_REQUIRED);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await remove(profile.id, password);
      onClose();
    } catch (failure) {
      if (isApiError(failure) && failure.code === 'invalid_credentials') {
        setError(failure.message);
      } else {
        // The toast would be behind this dialog, so the dialog goes first.
        onClose();
        showToast(errorToast(failure, DELETE_PROFILE_FAILED_TITLE));
      }
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
          <Text className="text-[17px] font-bold text-ink mb-1.5">{DELETE_PROFILE_TITLE(profile.name)}</Text>
          <Text className="text-[13px] leading-[19px] text-muted mb-4">{DELETE_PROFILE_TEXT(profile.name)}</Text>

          <Field
            label={DELETE_PROFILE_PASSWORD_LABEL}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            icon="lock-outline"
            secure
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleDelete}
            error={error}
          />
          <Text className="text-xs leading-[17px] text-muted -mt-1.5 mb-4 mx-0.5">{DELETE_PROFILE_PASSWORD_HINT(profile.name)}</Text>

          <View className="flex-row gap-3 mt-1">
            <TouchableOpacity onPress={onClose} className="flex-1 h-12 rounded-[14px] items-center justify-center bg-canvas">
              <Text className="text-muted font-semibold text-sm">{DELETE_CANCEL_LABEL}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={busy}
              className="flex-1 h-12 rounded-[14px] items-center justify-center"
              style={{ backgroundColor: busy ? colors.disabledGradient[0] : colors.expense }}
            >
              <Text className="text-white font-semibold text-sm">{busy ? DELETE_PROFILE_SUBMITTING : DELETE_PROFILE_SUBMIT}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
