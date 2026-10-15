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
  FORGOT_ROUTE,
  PASSWORD_LABEL,
  PASSWORD_REQUIRED_MESSAGE,
  REGISTER_ROUTE,
} from '@/types/components/auth/auth-type';
import {
  CREATE_ACCOUNT_LINK,
  FORGOT_LINK,
  LOGIN_BUSY_BUTTON,
  LOGIN_BUTTON,
  LOGIN_FAILED_TITLE,
  LOGIN_SUBTITLE,
  LOGIN_TITLE,
  NO_ACCOUNT_TEXT,
} from '@/types/login/login-type';
import { errorToast } from '@/utils/apiErrors';
import { isValidEmail } from '@/utils/authForm';

type Errors = { email?: string; password?: string };

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { signIn } = useAuth();
  const { showToast } = useFeedback();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (busy) return;
    const next: Errors = {};
    if (!isValidEmail(email)) next.email = EMAIL_INVALID_MESSAGE;
    if (!password) next.password = PASSWORD_REQUIRED_MESSAGE;
    setErrors(next);
    if (next.email || next.password) return;

    setBusy(true);
    try {
      // Once the session opens, the gate of the layout takes the person to the dashboard.
      await signIn(email, password);
    } catch (error) {
      if (isApiError(error) && error.code === 'validation_failed') {
        const fields = fieldErrors(error);
        setErrors({ email: fields.email, password: fields.password });
      } else {
        showToast(errorToast(error, LOGIN_FAILED_TITLE));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title={LOGIN_TITLE} subtitle={LOGIN_SUBTITLE}>
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
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        icon="lock-outline"
        secure
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
        error={errors.password}
      />

      <TouchableOpacity onPress={() => router.push(FORGOT_ROUTE as any)} className="self-end mb-5 -mt-1" hitSlop={8}>
        <Text className="text-[13px] font-semibold text-primary">{FORGOT_LINK}</Text>
      </TouchableOpacity>

      <GradientButton
        title={busy ? LOGIN_BUSY_BUTTON : LOGIN_BUTTON}
        onPress={handleSubmit}
        colors={busy ? colors.disabledGradient : undefined}
      />

      <View className="flex-row items-center justify-center gap-1.5 mt-5">
        <Text className="text-[14px] text-muted">{NO_ACCOUNT_TEXT}</Text>
        <TouchableOpacity onPress={() => router.push(REGISTER_ROUTE as any)} hitSlop={8}>
          <Text className="text-[14px] font-bold text-primary">{CREATE_ACCOUNT_LINK}</Text>
        </TouchableOpacity>
      </View>
    </AuthScreen>
  );
}
