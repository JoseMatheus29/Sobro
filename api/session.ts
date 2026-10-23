import { readToken, removeToken, writeToken } from '@/api/tokenStorage';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/types/api/api-type';

export interface Session {
  accessToken: string;
  refreshToken: string;
}

// The tokens are the only thing the app keeps on the device about the account, and only in the secure
// store (`tokenStorage`; the browser's version uses localStorage). A read that fails (a keystore that cannot
// be opened) counts as "no token": the next request then ends in the login screen instead of crashing.
async function read(key: string): Promise<string | null> {
  try {
    return await readToken(key);
  } catch {
    return null;
  }
}

export const getAccessToken = () => read(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => read(REFRESH_TOKEN_KEY);

export async function hasSession(): Promise<boolean> {
  return (await getRefreshToken()) !== null;
}

export async function saveSession(session: Session): Promise<void> {
  await writeToken(ACCESS_TOKEN_KEY, session.accessToken);
  await writeToken(REFRESH_TOKEN_KEY, session.refreshToken);
}

export async function clearSession(): Promise<void> {
  try {
    await removeToken(ACCESS_TOKEN_KEY);
    await removeToken(REFRESH_TOKEN_KEY);
  } catch {
    // Nothing else to do: the next read will fail the same way and count as no session.
  }
}

// What the client tells the app: the session ended (renewing it was refused), or the server wants a newer app.
let sessionExpiredHandler: () => void = () => {};
let upgradeRequiredHandler: () => void = () => {};

export const setOnSessionExpired = (handler: () => void) => {
  sessionExpiredHandler = handler;
};
export const setOnUpgradeRequired = (handler: () => void) => {
  upgradeRequiredHandler = handler;
};
export const notifySessionExpired = () => sessionExpiredHandler();
export const notifyUpgradeRequired = () => upgradeRequiredHandler();
