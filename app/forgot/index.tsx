import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { forgotPassword } from '@/api/auth';
import { fieldErrors, isApiError } from '@/api/errors';
import AuthScreen from '@/app/components/auth/AuthScreen';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import Field from '@/app/components/ui/Field';
import GradientButton from '@/app/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import {
  BACK_TO_LOGIN_LABEL,
  EMAIL_INVALID_MESSAGE,
  EMAIL_LABEL,
  EMAIL_PLACEHOLDER,
  LOGIN_ROUTE,
  RESET_ROUTE,
} from '@/types/components/auth/auth-type';
import {
  FORGOT_BUSY_BUTTON,
  FORGOT_BUTTON,
  FORGOT_FAILED_TITLE,
  FORGOT_SENT_TEXT,
  FORGOT_SENT_TOAST,
  FORGOT_SUBTITLE,
  FORGOT_TITLE,
  HAVE_CODE_BUTTON,
  SEND_AGAIN_BUTTON,
} from '@/types/forgot/forgot-type';
import { errorToast } from '@/utils/apiErrors';
import { isValidEmail } from '@/utils/authForm';

export default function ForgotScreen() {
  const colors = useColors();
  const router = useRouter();
  const { showToast } = useFeedback();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (busy) return;
    if (!isValidEmail(email)) {
      setError(EMAIL_INVALID_MESSAGE);
      return;
    }
    setError(undefined);
    setBusy(true);
    try {
      await forgotPassword(email);
      setSent(true);
      showToast(FORGOT_SENT_TOAST);
    } catch (failure) {
      if (isApiError(failure) && failure.code === 'validation_failed') setError(fieldErrors(failure).email);
      else showToast(errorToast(failure, FORGOT_FAILED_TITLE));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={FORGOT_TITLE} subtitle={FORGOT_SUBTITLE}>
      <Field
        label={EMAIL_LABEL}
        placeholder={EMAIL_PLACEHOLDER}
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        error={error}
      />

      {sent && <Text className="text-[13px] leading-[19px] text-muted mb-4">{FORGOT_SENT_TEXT}</Text>}

      <GradientButton
        title={busy ? FORGOT_BUSY_BUTTON : sent ? SEND_AGAIN_BUTTON : FORGOT_BUTTON}
        onPress={handleSubmit}
        colors={busy ? colors.disabledGradient : undefined}
      />

      {sent && (
        <TouchableOpacity
          onPress={() => router.push(RESET_ROUTE as any)}
          className="h-12 rounded-2xl items-center justify-center mt-3 bg-canvas"
        >
          <Text className="text-[14px] font-bold text-primary">{HAVE_CODE_BUTTON}</Text>
        </TouchableOpacity>
      )}

      <View className="items-center mt-5">
        <TouchableOpacity onPress={() => router.replace(LOGIN_ROUTE as any)} hitSlop={8}>
          <Text className="text-[14px] font-bold text-primary">{BACK_TO_LOGIN_LABEL}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}
