import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { fieldErrors, isApiError } from '@/api/errors';
import AuthScreen from '@/app/components/auth/AuthScreen';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import Field from '@/app/components/ui/Field';
import GradientButton from '@/app/components/ui/GradientButton';
import { useColors } from '@/hooks/useColors';
import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_LABEL,
  EMAIL_PLACEHOLDER,
  LOGIN_ROUTE,
  NAME_MAX_LENGTH,
  PASSWORD_LABEL,
  PASSWORD_LONG_MESSAGE,
  PASSWORD_PLACEHOLDER,
  PASSWORD_SHORT_MESSAGE,
  PASSWORDS_DIFFER_MESSAGE,
} from '@/types/components/auth/auth-type';
import {
  CONFIRM_PASSWORD_LABEL,
  CONFIRM_PASSWORD_PLACEHOLDER,
  EMAIL_TAKEN_CODE,
  EMAIL_TAKEN_MESSAGE,
  HAS_ACCOUNT_TEXT,
  NAME_LABEL,
  NAME_PLACEHOLDER,
  REGISTER_BUSY_BUTTON,
  REGISTER_BUTTON,
  REGISTER_FAILED_TITLE,
  REGISTER_SUBTITLE,
  REGISTER_TITLE,
  SIGN_IN_LINK,
} from '@/types/register/register-type';
import { errorToast } from '@/utils/apiErrors';
import { isValidEmail, passwordProblem } from '@/utils/authForm';

type Errors = { name?: string; email?: string; password?: string; confirm?: string };

export default function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signUp } = useAuth();
  const { showToast } = useFeedback();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (busy) return;
    const next: Errors = {};
    if (!isValidEmail(email)) next.email = EMAIL_INVALID_MESSAGE;
    const problem = passwordProblem(password);
    if (problem) next.password = problem === 'short' ? PASSWORD_SHORT_MESSAGE : PASSWORD_LONG_MESSAGE;
    else if (confirm !== password) next.confirm = PASSWORDS_DIFFER_MESSAGE;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      // Once the session opens, the gate of the layout takes the person to the dashboard.
      await signUp({ email, password, name });
    } catch (error) {
      if (isApiError(error) && error.code === EMAIL_TAKEN_CODE) {
        setErrors({ email: EMAIL_TAKEN_MESSAGE });
      } else if (isApiError(error) && error.code === 'validation_failed') {
        const fields = fieldErrors(error);
        setErrors({ name: fields.name, email: fields.email, password: fields.password });
      } else {
        showToast(errorToast(error, REGISTER_FAILED_TITLE));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={REGISTER_TITLE} subtitle={REGISTER_SUBTITLE}>
      <Field
        label={NAME_LABEL}
        placeholder={NAME_PLACEHOLDER}
        value={name}
        onChangeText={setName}
        icon="badge"
        autoCapitalize="words"
        autoComplete="name"
        maxLength={NAME_MAX_LENGTH}
        returnKeyType="next"
        error={errors.name}
      />
      <Field
        label={EMAIL_LABEL}
        placeholder={EMAIL_PLACEHOLDER}
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        keyboardType="email-address"
        autoComplete="email"
        returnKeyType="next"
        error={errors.email}
      />
      <Field
        label={PASSWORD_LABEL}
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
        label={CONFIRM_PASSWORD_LABEL}
        placeholder={CONFIRM_PASSWORD_PLACEHOLDER}
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
          title={busy ? REGISTER_BUSY_BUTTON : REGISTER_BUTTON}
          onPress={handleSubmit}
          colors={busy ? colors.disabledGradient : undefined}
        />
      </View>

      <View className="flex-row items-center justify-center gap-1.5 mt-5">
        <Text className="text-[14px] text-muted">{HAS_ACCOUNT_TEXT}</Text>
        <TouchableOpacity onPress={() => router.replace(LOGIN_ROUTE as any)} hitSlop={8}>
          <Text className="text-[14px] font-bold text-primary">{SIGN_IN_LINK}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}
