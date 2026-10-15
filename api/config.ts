import Constants from 'expo-constants';

import { APP_VERSION_FALLBACK, MISSING_API_URL_MESSAGE } from '@/types/api/api-type';

// The one place the API address is read. Set per build profile (see .env.example and eas.json).
export function apiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error(MISSING_API_URL_MESSAGE);
  return url.replace(/\/+$/, '');
}

// Sent in X-App-Version so the server can ask for an update (426) when the app is too old.
export function appVersion(): string {
  return Constants.expoConfig?.version ?? APP_VERSION_FALLBACK;
}
