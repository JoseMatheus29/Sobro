import { type ManagedProfile } from '@/db/profiles';
import { MAX_MANAGED_PROFILES } from '@/types/profiles/profiles-type';

// The letter in an avatar: the first one of the name, upper case. "?" for a name with nothing in it.
export function initialOf(name: string): string {
  const first = Array.from(name.trim())[0];
  return first ? first.toLocaleUpperCase('pt-BR') : '?';
}

// Whether one more profile can be made (the server refuses the sixth).
export const canAddProfile = (count: number): boolean => count < MAX_MANAGED_PROFILES;

// The profile to look at once `wanted` is asked for: the person's own (null) when it is not one they care for
// (it was deleted, or the list has not got it).
export function resolveActive(profiles: ManagedProfile[], wanted: string | null): ManagedProfile | null {
  if (wanted === null) return null;
  return profiles.find((profile) => profile.id === wanted) ?? null;
}

// The name to show for a profile, clipped for a place with little room (the chip of the Home).
export function shortName(name: string, max = 14): string {
  const text = name.trim();
  const chars = Array.from(text);
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join('')}…`;
}
