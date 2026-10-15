import { api } from './client';
import { clearSession, getRefreshToken, saveSession } from './session';
import { type AuthSession } from './types';

// Every route here goes without a token, and a 401 from them (a wrong password) never renews the session.

export async function login(email: string, password: string): Promise<void> {
  const session = await api<AuthSession>('POST', '/v1/auth/login', {
    body: { email: email.trim(), password },
    auth: false,
  });
  await saveSession(session);
}

export async function register(input: { email: string; password: string; name?: string }): Promise<void> {
  const name = input.name?.trim();
  const session = await api<AuthSession>('POST', '/v1/auth/register', {
    body: { email: input.email.trim(), password: input.password, ...(name ? { name } : {}) },
    auth: false,
  });
  await saveSession(session);
}

// Ends this device's session. If the server cannot be reached the tokens are erased here all the same.
export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    if (refreshToken) await api('POST', '/v1/auth/logout', { body: { refreshToken }, auth: false });
  } catch {
    // Nothing to tell: the session is over on this phone either way.
  } finally {
    await clearSession();
  }
}

export function forgotPassword(email: string): Promise<void> {
  return api('POST', '/v1/auth/forgot-password', { body: { email: email.trim() }, auth: false });
}

export function resetPassword(token: string, password: string): Promise<void> {
  return api('POST', '/v1/auth/reset-password', { body: { token, password }, auth: false });
}

// Deletes the account and all its data. A wrong password is a 401 `invalid_credentials`, and it is not a
// reason to renew the session (the client only renews on `unauthorized`).
export async function deleteAccount(password: string): Promise<void> {
  await api('DELETE', '/v1/me', { body: { password } });
  await clearSession();
}
