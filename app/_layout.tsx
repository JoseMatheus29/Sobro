import '../global.css';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

import { getProfile } from '@/db/profile';
import { migrateDbIfNeeded } from '@/db/schema';
import { useColors } from '@/hooks/useColors';
import { FeedbackProvider } from '@/app/components/feedback/FeedbackProvider';
import { MonthProvider } from '@/app/components/month/MonthProvider';
import RecurrenceSync from '@/app/components/RecurrenceSync';
import { applyTheme } from '@/utils/applyTheme';
import { ThemeProvider } from '@/app/components/theme/ThemeProvider';

// Opens the database and, before anything is drawn, applies the light/dark choice saved in the profile.
async function initDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  applyTheme((await getProfile(db)).theme);
}

export default function Layout() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

function Root() {
  const colors = useColors();

  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-canvas">
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      }
    >
      <SQLiteProvider databaseName="sobro.db" onInit={initDatabase} useSuspense>
        <FeedbackProvider>
          <RecurrenceSync />
          <MonthProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
              <Stack.Screen name="index" />
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
          </MonthProvider>
        </FeedbackProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
