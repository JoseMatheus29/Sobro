import { api } from '@/api/client';
import { isApiError } from '@/api/errors';
import { type ApiManagedProfile } from '@/api/types';

// The profiles the person cares for: someone else's finances (a mother's, say), kept apart from their own and
// reached from the same account (docs/api-perfis.md). They have no login. These are routes of the account, so the
// choice of the profile being looked at never goes with them.

export interface ManagedProfile {
  id: string;
  name: string;
  currency: string;
  remindersEnabled: boolean;
}

const toManaged = ({ id, name, currency, remindersEnabled }: ApiManagedProfile): ManagedProfile => ({
  id,
  name,
  currency,
  remindersEnabled,
});

// Oldest first. A server that does not know profiles yet answers 404: the same as having none.
export async function getManagedProfiles(): Promise<ManagedProfile[]> {
  try {
    const all = await api<ApiManagedProfile[]>('GET', '/v1/profiles');
    return all.filter((profile) => profile.kind === 'managed').map(toManaged);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return [];
    throw error;
  }
}

export async function createManagedProfile(name: string, idempotencyKey: string): Promise<ManagedProfile> {
  const created = await api<ApiManagedProfile>('POST', '/v1/profiles', { body: { name: name.trim() }, idempotencyKey });
  return toManaged(created);
}

export async function renameManagedProfile(id: string, name: string): Promise<ManagedProfile> {
  const renamed = await api<ApiManagedProfile>('PATCH', `/v1/profiles/${id}`, { body: { name: name.trim() } });
  return toManaged(renamed);
}

// Deletes the profile and everything in it for good. It asks for the password of the person, not of the profile
// (which has none): a wrong one is a 401 `invalid_credentials`.
export function deleteManagedProfile(id: string, password: string): Promise<void> {
  return api('DELETE', `/v1/profiles/${id}`, { body: { password } });
}
