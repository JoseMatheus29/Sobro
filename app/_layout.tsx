import '../global.css';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { palette } from '@/constants/palette';
import { migrateDbIfNeeded } from '@/db/schema';
import { FeedbackProvider } from './components/feedback/FeedbackProvider';
import { MonthProvider } from './components/month/MonthProvider';
import RecurrenceSync from './components/RecurrenceSync';

export default function Layout() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color={palette.primary.DEFAULT} />
        </View>
      }
    >
      <SQLiteProvider databaseName="sobro.db" onInit={migrateDbIfNeeded} useSuspense>
        <FeedbackProvider>
          <RecurrenceSync />
          <MonthProvider>
            <Stack screenOptions={{ headerShown: false }}>
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
