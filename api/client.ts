import * as Crypto from 'expo-crypto';

import { REFRESH_FAILED_MESSAGE, REQUEST_TIMEOUT_MS, UNAUTHORIZED_CODE, UNKNOWN_ERROR_MESSAGE } from '@/types/api/api-type';
import { appVersion, apiBaseUrl } from './config';
import { ApiError, NetworkError, type FieldIssue } from './errors';
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  notifySessionExpired,
  notifyUpgradeRequired,
  saveSession,
} from './session';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface ApiOptions {
  body?: unknown;
  /** One per attempt to save; the same one again when the person taps "Tentar de novo". */
  idempotencyKey?: string;
  /** False for /auth/*: no token is sent and a 401 there never renews the session. */
  auth?: boolean;
}

interface ErrorBody {
  error?: { code?: string; message?: string; fields?: FieldIssue[] };
}

// A new key per attempt to save. Create it when the person taps Save and keep it for the retries.
export const newIdempotencyKey = () => Crypto.randomUUID();

async function send(method: HttpMethod, path: string, opts: ApiOptions, token: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const hasBody = opts.body !== undefined;
  // Read outside the try: a missing address is a bug in the build, not a network failure.
  const url = `${apiBaseUrl()}${path}`;
  try {
    return await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'X-App-Version': appVersion(),
        // Only with a body: the server answers 400 to a JSON content type with nothing in it.
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.idempotencyKey ? { 'Idempotency-Key': opts.idempotencyKey } : {}),
      },
      ...(hasBody ? { body: JSON.stringify(opts.body) } : {}),
    });
  } catch {
    // No signal, or the timeout aborted it.
    throw new NetworkError();
  } finally {
    clearTimeout(timer);
  }
}

// One renewal at a time: calls that find the token expired together wait for the same promise. The refresh
// token works once, so each of them renewing would burn it and the server would end the whole session.
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      notifySessionExpired();
      return false;
    }
    // A NetworkError here goes up as it is: no signal is not a reason to end the session.
    const res = await send('POST', '/v1/auth/refresh', { body: { refreshToken }, auth: false }, null);
    if (res.status === 401) {
      await clearSession();
      notifySessionExpired();
      return false;
    }
    if (!res.ok) throw new ApiError(res.status, 'refresh_failed', REFRESH_FAILED_MESSAGE);
    const tokens = (await res.json()) as { accessToken: string; refreshToken: string };
    // Both new tokens are saved before anything uses them.
    await saveSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function request<T>(method: HttpMethod, path: string, opts: ApiOptions, retried: boolean): Promise<T> {
  const auth = opts.auth ?? true;
  const token = auth ? await getAccessToken() : null;
  const res = await send(method, path, opts, token);

  const json: unknown = res.status === 204 ? undefined : await res.json().catch(() => null);
  const failure = (json as ErrorBody | null | undefined)?.error;

  // Only an expired token renews: a wrong password (401 `invalid_credentials`) on a protected route does not.
  if (res.status === 401 && auth && !retried && (!failure?.code || failure.code === UNAUTHORIZED_CODE)) {
    // Another call may already have renewed it while this one was on its way: just send it again.
    const current = await getAccessToken();
    if ((current !== null && current !== token) || (await refreshSession())) {
      return request<T>(method, path, opts, true);
    }
  }
  if (res.status === 426) notifyUpgradeRequired();

  if (!res.ok) {
    throw new ApiError(res.status, failure?.code ?? 'unknown', failure?.message ?? UNKNOWN_ERROR_MESSAGE, failure?.fields);
  }
  return json as T;
}

export function api<T = void>(method: HttpMethod, path: string, opts: ApiOptions = {}): Promise<T> {
  return request<T>(method, path, opts, false);
}
