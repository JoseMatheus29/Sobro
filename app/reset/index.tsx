import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { resetPassword } from '@/api/auth';
import { fieldErrors, isApiError } from '@/api/errors';
import AuthScreen from '@/app/components/auth/AuthScreen';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import Field from '@/app/components/ui/Field';
import GradientButton from '@/app/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import {
  BACK_TO_LOGIN_LABEL,
  FORGOT_ROUTE,
  LOGIN_ROUTE,
  PASSWORD_LONG_MESSAGE,
  PASSWORD_PLACEHOLDER,
  PASSWORD_SHORT_MESSAGE,
  PASSWORDS_DIFFER_MESSAGE,
} from '@/types/components/auth/auth-type';
import {
  ASK_NEW_LINK_BUTTON,
  CONFIRM_NEW_PASSWORD_LABEL,
  INVALID_RESET_TOKEN_CODE,
  NEW_PASSWORD_LABEL,
  RESET_BUSY_BUTTON,
  RESET_BUTTON,
  RESET_DONE_TOAST,
  RESET_FAILED_TITLE,
  RESET_SUBTITLE,
  RESET_TITLE,
  TOKEN_LABEL,
  TOKEN_PLACEHOLDER,
  TOKEN_REQUIRED_MESSAGE,
} from '@/types/reset/reset-type';
import { errorToast } from '@/utils/apiErrors';
import { extractResetToken, findResetToken, passwordProblem } from '@/utils/authForm';

type Errors = { token?: string; password?: string; confirm?: string };

// Where the link of the e-mail leads. It carries the token after `#token=`, which the router does not hand
// over as a parameter, so it is read from the URL that opened the app (or from a `?token=`); otherwise the
// person pastes the link, or just its code.
export default function ResetScreen() {
  const colors = useColors();
  const router = useRouter();
  const { showToast } = useFeedback();
  const params = useLocalSearchParams<{ token?: string }>();
  const url = Linking.useURL();

  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromLink = (url ? findResetToken(url) : null) ?? (typeof params.token === 'string' ? params.token : null);
    if (fromLink) setToken((current) => current || fromLink);
  }, [url, params.token]);

  const handleSubmit = async () => {
    if (busy) return;
    const next: Errors = {};
    const code = extractResetToken(token);
    if (!code) next.token = TOKEN_REQUIRED_MESSAGE;
    const problem = passwordProblem(password);
    if (problem) next.password = problem === 'short' ? PASSWORD_SHORT_MESSAGE : PASSWORD_LONG_MESSAGE;
    else if (confirm !== password) next.confirm = PASSWORDS_DIFFER_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await resetPassword(code, password);
      showToast(RESET_DONE_TOAST);
      router.replace(LOGIN_ROUTE as any);
    } catch (error) {
      if (isApiError(error) && error.code === INVALID_RESET_TOKEN_CODE) {
        setErrors({ token: error.message });
      } else if (isApiError(error) && error.code === 'validation_failed') {
        const fields = fieldErrors(error);
        setErrors({ token: fields.token, password: fields.password });
      } else {
        showToast(errorToast(error, RESET_FAILED_TITLE));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={RESET_TITLE} subtitle={RESET_SUBTITLE}>
      <Field
        label={TOKEN_LABEL}
        placeholder={TOKEN_PLACEHOLDER}
        value={token}
        onChangeText={setToken}
        icon="vpn-key"
        returnKeyType="next"
        error={errors.token}
      />
      <Field
        label={NEW_PASSWORD_LABEL}
        placeholder={PASSWORD_PLACEHOLDER}
        value={password}
        onChangeText={setPassword}
        icon="lock-outline"
        secure
        autoComplete="new-password"
        returnKeyType="next"
        error={errors.password}
      />
      <Field
        label={CONFIRM_NEW_PASSWORD_LABEL}
        placeholder={PASSWORD_PLACEHOLDER}
        value={confirm}
        onChangeText={setConfirm}
        icon="lock-outline"
        secure
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={errors.confirm}
      />

      <View className="mt-2">
        <GradientButton
          title={busy ? RESET_BUSY_BUTTON : RESET_BUTTON}
          onPress={handleSubmit}
          colors={busy ? colors.disabledGradient : undefined}
        />
      </View>

      {errors.token && (
        <TouchableOpacity
          onPress={() => router.replace(FORGOT_ROUTE as any)}
          className="h-12 rounded-2xl items-center justify-center mt-3 bg-canvas"
        >
          <Text className="text-[14px] font-bold text-primary">{ASK_NEW_LINK_BUTTON}</Text>
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
