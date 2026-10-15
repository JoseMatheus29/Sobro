import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import Field from '@/app/components/ui/Field';
import { useColors } from '@/hooks/useColors';
import {
  ACCOUNT_DELETED_TOAST,
  DELETE_CANCEL_LABEL,
  DELETE_FAILED_TITLE,
  DELETE_MODAL_TEXT,
  DELETE_MODAL_TITLE,
  DELETE_PASSWORD_LABEL,
  DELETE_PASSWORD_REQUIRED,
  DELETE_SUBMITTING_LABEL,
  DELETE_SUBMIT_LABEL,
} from '@/types/editAcount/editAcount-type';
import { errorToast } from '@/utils/apiErrors';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

// Asks for the password before deleting the account. A wrong password shows up inside the dialog: a toast
// would be drawn behind the Modal.
export default function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const colors = useColors();
  const { deleteAccount } = useAuth();
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

  const handleDelete = async () => {
    if (busy) return;
    if (!password) {
      setError(DELETE_PASSWORD_REQUIRED);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      // The session ends with the account, and the gate of the layout takes the person to the login.
      await deleteAccount(password);
      onClose();
      showToast(ACCOUNT_DELETED_TOAST);
    } catch (failure) {
      if (isApiError(failure) && failure.code === 'invalid_credentials') {
        setError(failure.message);
      } else {
        // The toast would be behind this dialog, so the dialog goes first.
        onClose();
        showToast(errorToast(failure, DELETE_FAILED_TITLE));
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
        <View className="bg-card rounded-[24px] p-5 w-full">
          <Text className="text-[15px] font-bold text-ink mb-1.5">{DELETE_MODAL_TITLE}</Text>
          <Text className="text-[13px] leading-[19px] text-muted mb-4">{DELETE_MODAL_TEXT}</Text>

          <Field
            label={DELETE_PASSWORD_LABEL}
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
              <Text className="text-white font-semibold text-sm">{busy ? DELETE_SUBMITTING_LABEL : DELETE_SUBMIT_LABEL}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
