import '../global.css';
import '@/utils/nativewindInterop';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';

import { getStoredTheme } from '@/db/theme';
import { useColors } from '@/hooks/useColors';
import { AuthProvider, useAuth } from '@/app/components/auth/AuthProvider';
import SessionGate from '@/app/components/auth/SessionGate';
import UpgradeRequired from '@/app/components/auth/UpgradeRequired';
import { FeedbackProvider } from '@/app/components/feedback/FeedbackProvider';
import { MonthProvider } from '@/app/components/month/MonthProvider';
import ProfileFrame from '@/app/components/profile/ProfileFrame';
import { ProfileProvider } from '@/app/components/profile/ProfileProvider';
import QueryProvider from '@/app/components/QueryProvider';
import RecurrenceSync from '@/app/components/RecurrenceSync';
import { applyTheme } from '@/utils/applyTheme';
import { ThemeProvider } from '@/app/components/theme/ThemeProvider';
import WebFrame from '@/app/components/ui/WebFrame';

// Before anything is drawn, applies the light/dark choice kept on the phone. It is not in the account: it has
// to be right on the login screens too.
function useThemeReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getStoredTheme().then((theme) => {
      applyTheme(theme);
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

export default function Layout() {
  return (
    <ThemeProvider>
      <WebFrame>
        <Root />
      </WebFrame>
    </ThemeProvider>
  );
}

function Root() {
  const colors = useColors();
  const themeReady = useThemeReady();

  if (!themeReady) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  return (
    <FeedbackProvider>
      <AuthProvider>
        <QueryProvider>
          <RootNavigator />
        </QueryProvider>
      </AuthProvider>
    </FeedbackProvider>
  );
}

// The screens, or the notice to update the app when the server refuses this version. The profile provider holds whose
// finances are open (the person's own, or one they care for) and the frame puts the banner of the latter on top.
function RootNavigator() {
  const { upgradeRequired } = useAuth();

  if (upgradeRequired) return <UpgradeRequired />;

  return (
    <ProfileProvider>
      <SessionGate />
      <RecurrenceSync />
      <ProfileFrame>
        <MonthProvider>
          <ScreenStack />
        </MonthProvider>
      </ProfileFrame>
    </ProfileProvider>
  );
}

function ScreenStack() {
  const colors = useColors();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login/index" />
      <Stack.Screen name="register/index" />
      <Stack.Screen name="forgot/index" />
      <Stack.Screen name="reset/index" />
      <Stack.Screen name="dashboard/index" />
      <Stack.Screen name="wallet/index" />
      <Stack.Screen name="myDetailing/index" />
      <Stack.Screen name="editAcount/index" />
      {/* Folha sobre a tela de origem: o fundo da rota é transparente e a tela desenha o escurecimento. */}
      <Stack.Screen
        name="registrationSpent/index"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen name="detailsSpend/[id]" />
      <Stack.Screen name="invoice/[id]" />
      {/* Também folhas, como a de nova transação. */}
      <Stack.Screen
        name="history/index"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="transfer/index"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="payInvoice/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="search/index"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="goal/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <Stack.Screen
        name="insights/index"
        options={{
          presentation: 'transparentModal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
    </Stack>
  );
}
