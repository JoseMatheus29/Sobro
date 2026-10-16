import { api } from '@/api/client';
import { type ApiProfile, type ProfilePatch } from '@/api/types';
import { type ThemePreference } from '@/utils/theme-type';
import { getStoredTheme, setStoredTheme } from './theme';

export interface ProfileRecord {
  /** The account, for what is kept on this phone about it (see db/tutorial.ts). */
  id: string;
  email: string;
  name: string;
  currency: string;
  /** Reminders, the day before, of the recurring expenses about to fall due. */
  remindersEnabled: boolean;
  /** Follow the phone's light/dark setting, or force one. Kept on the phone, not on the server. */
  theme: ThemePreference;
}

// The account's profile from the server, with the look chosen on this phone.
export async function getProfile(): Promise<ProfileRecord> {
  const [me, theme] = await Promise.all([api<ApiProfile>('GET', '/v1/me'), getStoredTheme()]);
  return {
    id: me.id,
    email: me.email,
    name: me.name,
    currency: me.currency,
    remindersEnabled: me.remindersEnabled,
    theme,
  };
}

export async function updateProfile(patch: ProfilePatch & { theme?: ThemePreference }): Promise<void> {
  const { theme, ...account } = patch;
  if (theme !== undefined) await setStoredTheme(theme);
  if (Object.keys(account).length > 0) await api('PATCH', '/v1/me', { body: account });
}
