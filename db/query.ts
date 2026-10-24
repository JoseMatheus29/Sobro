import { useIsFocused } from 'expo-router';
import { useQuery, type QueryFunctionContext, type QueryKey, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import { getActiveProfileId, scopeOf } from '@/api/activeProfile';
import { useActiveProfileId } from '@/hooks/useActiveProfileId';

// A read that was started for a profile the app has already left. Its answer would land under the wrong profile's key
// if it were allowed to go on, so it stops before it asks.
export class ProfileChangedError extends Error {
  constructor() {
    super('The profile changed.');
    this.name = 'ProfileChangedError';
  }
}

type ScreenQueryOptions<T> = Omit<UseQueryOptions<T, Error>, 'enabled' | 'placeholderData'> & {
  enabled?: boolean;
  /** Keep showing the last answer while a new key loads (another month), but never one read for another profile. */
  keepPrevious?: boolean;
  /** A read of the account itself (the person's own `/me`, the list of profiles): it is the same whatever profile is open. */
  account?: boolean;
};

// A query that only runs while its screen is the one in front. Screens of a Stack stay mounted behind the
// one on top, and a change made on top (a transaction saved in a sheet) would otherwise refetch every one of
// them at once. Behind, a query is just marked old, and it reads again when its screen comes back.
//
// Every read of data is kept under the profile it was made for (the first part of its key), so what was read for one
// profile can never be shown for another: switching profiles just makes a screen look at other keys.
export function useScreenQuery<T>(options: ScreenQueryOptions<T>): UseQueryResult<T, Error> {
  const focused = useIsFocused();
  const profileId = useActiveProfileId();
  const { enabled = true, keepPrevious = false, account = false, queryKey, queryFn, ...rest } = options;

  const scope = account ? null : scopeOf(profileId);
  const scopedKey: QueryKey = scope === null ? queryKey! : [scope, ...queryKey!];
  const guardedFn =
    scope !== null && typeof queryFn === 'function'
      ? (context: QueryFunctionContext<QueryKey>) => {
          if (scopeOf(getActiveProfileId()) !== scope) return Promise.reject(new ProfileChangedError());
          return queryFn(context as QueryFunctionContext<QueryKey, never>);
        }
      : queryFn;

  return useQuery<T, Error>({
    ...rest,
    queryKey: scopedKey,
    queryFn: guardedFn,
    placeholderData: keepPrevious
      ? (previous, previousQuery) => (previousQuery?.queryKey[0] === scope ? previous : undefined)
      : undefined,
    enabled: focused && enabled,
  });
}

// Not a new array on every render for a query that has not answered yet.
export const NONE: never[] = [];

// The error of a read that has nothing to show. A refresh that fails behind data that is already on screen is not one:
// the screen keeps what it has, and only a screen with nothing to show says it could not load.
export function loadError(query: { data: unknown; error: Error | null }): Error | null {
  return query.data === undefined ? query.error : null;
}
