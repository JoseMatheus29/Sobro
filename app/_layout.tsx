import '../global.css';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

import { migrateDbIfNeeded } from '@/db/schema';

export default function Layout() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#3161B2" />
        </View>
      }
    >
      <SQLiteProvider databaseName="jm-finance.db" onInit={migrateDbIfNeeded} useSuspense>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="dashboard" />
          <Stack.Screen name="wallet" />
          <Stack.Screen name="myDetailing" />
          <Stack.Screen name="editAcount" />
          <Stack.Screen name="registrationSpent" />
          <Stack.Screen name="detailsSpend/[id]" />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
