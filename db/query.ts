import { useIsFocused } from '@react-navigation/native';
import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

// A query that only runs while its screen is the one in front. Screens of a Stack stay mounted behind the
// one on top, and a change made on top (a transaction saved in a sheet) would otherwise refetch every one of
// them at once. Behind, a query is just marked old, and it reads again when its screen comes back.
export function useScreenQuery<T>(
  options: Omit<UseQueryOptions<T, Error>, 'enabled'> & { enabled?: boolean }
): UseQueryResult<T, Error> {
  const focused = useIsFocused();
  const { enabled = true, ...rest } = options;
  return useQuery<T, Error>({ ...rest, enabled: focused && enabled });
}

// Not a new array on every render for a query that has not answered yet.
export const NONE: never[] = [];
