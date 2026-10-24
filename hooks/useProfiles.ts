import { createContext, useContext } from 'react';

import { PROFILES_HOOK_ERROR, type ProfilesContextValue } from '@/types/profiles/profiles-type';

// The profiles of other people the account cares for, and which one is open. ProfileProvider provides it.
export const ProfilesContext = createContext<ProfilesContextValue | null>(null);

export function useProfiles(): ProfilesContextValue {
  const value = useContext(ProfilesContext);
  if (!value) throw new Error(PROFILES_HOOK_ERROR);
  return value;
}
