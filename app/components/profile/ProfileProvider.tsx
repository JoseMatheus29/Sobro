import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { setActiveProfileId, setOnProfileForbidden } from '@/api/activeProfile';
import { queryClient } from '@/api/queryClient';
import { useAuth } from '@/app/components/auth/AuthProvider';
import { useFeedback } from '@/app/components/feedback/FeedbackProvider';
import ProfileFormModal from '@/app/components/profile/ProfileFormModal';
import {
  createManagedProfile,
  deleteManagedProfile,
  getManagedProfiles,
  renameManagedProfile,
  type ManagedProfile,
} from '@/db/profiles';
import { queryKeys } from '@/db/queryKeys';
import { ActiveProfileIdContext } from '@/hooks/useActiveProfileId';
import { ProfilesContext } from '@/hooks/useProfiles';
import { HOME_ROUTE } from '@/types/components/auth/auth-type';
import {
  PROFILE_CREATED_TOAST,
  PROFILE_DELETED_TOAST,
  PROFILE_FORBIDDEN_TOAST,
  type ProfilesContextValue,
} from '@/types/profiles/profiles-type';
import { resolveActive } from '@/utils/profiles';

const NO_PROFILES: ManagedProfile[] = [];

// Whose finances the app is looking at: the person's own, or a profile of someone else they care for. It sits above the
// Stack, below the session and the cache, and does three things:
//  - keeps the list of profiles the account manages;
//  - keeps which one is open, both here (for the screens) and in `api/activeProfile` (for the HTTP client, which names it
//    on every call). The reads of data are kept under the profile they were made for (db/query.ts), so switching only
//    makes the screens look at other keys; nothing of one profile can show in another.
//  - goes back to the person's own when the server stops letting them in (it was deleted, or the access is gone).
// What is open is not remembered: the app always starts on the person's own.
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { showToast } = useFeedback();
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  // What the callbacks of the HTTP client see: the profile open now, not the one open when they were set.
  const activeRef = useRef<string | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useQuery({
    queryKey: queryKeys.managedProfiles,
    queryFn: getManagedProfiles,
    enabled: status === 'signedIn',
  });
  const profiles = list.data ?? NO_PROFILES;
  const active = resolveActive(profiles, activeId);

  // The Home, with nothing of the profile just left behind it: Back must not lead into its screens.
  const goHome = useCallback(() => {
    if (router.canDismiss()) router.dismissAll();
    router.replace(HOME_ROUTE as any);
  }, [router]);

  const switchTo = useCallback(
    (id: string | null) => {
      if (id === activeRef.current) return;
      activeRef.current = id;
      // The client first: the screens render with the new profile right after, and what they ask for must be about it.
      setActiveProfileId(id);
      setActiveId(id);
      goHome();
    },
    [goHome]
  );

  // Not a session (signed out, or still reading it) means the person's own, whoever was open before.
  useEffect(() => {
    if (status === 'signedIn') return;
    activeRef.current = null;
    setActiveProfileId(null);
    setActiveId(null);
  }, [status]);

  const leaveUnavailable = useCallback(() => {
    switchTo(null);
    showToast(PROFILE_FORBIDDEN_TOAST);
    queryClient.invalidateQueries({ queryKey: queryKeys.managedProfiles });
  }, [switchTo, showToast]);

  useEffect(() => {
    setOnProfileForbidden((profileId) => {
      if (profileId === activeRef.current) leaveUnavailable();
    });
    return () => setOnProfileForbidden(() => {});
  }, [leaveUnavailable]);

  // The list says it is not one of theirs anymore (deleted from another phone).
  useEffect(() => {
    if (activeId === null || !list.isSuccess || list.isFetching) return;
    if (!profiles.some((profile) => profile.id === activeId)) leaveUnavailable();
  }, [activeId, list.isSuccess, list.isFetching, profiles, leaveUnavailable]);

  const setList = useCallback((update: (current: ManagedProfile[]) => ManagedProfile[]) => {
    queryClient.setQueryData<ManagedProfile[]>(queryKeys.managedProfiles, (current) => update(current ?? NO_PROFILES));
  }, []);

  const create = useCallback(
    async (name: string, key: string) => {
      const created = await createManagedProfile(name, key);
      // A read of the list that started before this one existed must not bring back the old list over the new one.
      await queryClient.cancelQueries({ queryKey: queryKeys.managedProfiles });
      setList((current) => [...current.filter((profile) => profile.id !== created.id), created]);
      // `/me` says how many profiles the account has (the warning before deleting it), so it is read again.
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      return created;
    },
    [setList]
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      const renamed = await renameManagedProfile(id, name);
      setList((current) => current.map((profile) => (profile.id === id ? renamed : profile)));
      return renamed;
    },
    [setList]
  );

  const remove = useCallback(
    async (id: string, password: string) => {
      const name = profiles.find((profile) => profile.id === id)?.name ?? '';
      await deleteManagedProfile(id, password);
      if (activeRef.current === id) switchTo(null);
      setList((current) => current.filter((profile) => profile.id !== id));
      // Everything read for it is of no use to anyone now.
      queryClient.removeQueries({ queryKey: [id] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      showToast(PROFILE_DELETED_TOAST(name));
    },
    [profiles, switchTo, setList, showToast]
  );

  const openCreate = useCallback(() => setCreating(true), []);

  const value = useMemo<ProfilesContextValue>(
    () => ({ profiles, active, loading: list.isLoading, switchTo, openCreate, create, rename, remove }),
    [profiles, active, list.isLoading, switchTo, openCreate, create, rename, remove]
  );

  return (
    <ActiveProfileIdContext.Provider value={activeId}>
      <ProfilesContext.Provider value={value}>
        {children}
        {/* The dialog is here, not in a screen, because the sheet of the Home and the card of Perfil both open it. */}
        <ProfileFormModal
          visible={creating}
          profile={null}
          onClose={() => setCreating(false)}
          onSaved={(created) => {
            setCreating(false);
            switchTo(created.id);
            showToast(PROFILE_CREATED_TOAST(created.name));
          }}
        />
      </ProfilesContext.Provider>
    </ActiveProfileIdContext.Provider>
  );
}

// Everything under app/ is a route for Expo Router, which warns about a file with no default export.
export default ProfileProvider;
