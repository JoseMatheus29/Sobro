import { api, newIdempotencyKey } from './client';
import { ApiError, NetworkError } from './errors';
import { getAccessToken, getRefreshToken, saveSession, setOnSessionExpired, setOnUpgradeRequired } from './session';

// An in-memory secure store, so the tests read and write tokens the way the app does.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});
jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d') }));
// Babel inlines process.env.EXPO_PUBLIC_* when it compiles, so the address and the version are set here instead.
jest.mock('./config', () => ({ apiBaseUrl: () => 'https://api.test', appVersion: () => '2.0.0' }));

const fetchMock = jest.fn();
const onExpired = jest.fn();
const onUpgrade = jest.fn();

function reply(status: number, body?: unknown) {
  return { status, ok: status >= 200 && status < 300, json: async () => body };
}
const unauthorized = () => reply(401, { error: { code: 'unauthorized', message: 'Sessão inválida ou expirada.' } });

// The header a call went out with.
function header(call: number, name: string): string | undefined {
  return fetchMock.mock.calls[call][1].headers[name];
}
const urlOf = (call: number): string => fetchMock.mock.calls[call][0];

beforeEach(async () => {
  fetchMock.mockReset();
  onExpired.mockReset();
  onUpgrade.mockReset();
  (global as { fetch: unknown }).fetch = fetchMock;
  setOnSessionExpired(onExpired);
  setOnUpgradeRequired(onUpgrade);
  await saveSession({ accessToken: 'access-1', refreshToken: 'refresh-1' });
});

describe('request', () => {
  it('sends the app version and the token, and a JSON body with its content type', async () => {
    fetchMock.mockResolvedValue(reply(201, { id: 1 }));

    const result = await api<{ id: number }>('POST', '/v1/cards', { body: { name: 'Nubank' } });

    expect(result).toEqual({ id: 1 });
    expect(urlOf(0)).toBe('https://api.test/v1/cards');
    expect(header(0, 'X-App-Version')).toBe('2.0.0');
    expect(header(0, 'Authorization')).toBe('Bearer access-1');
    expect(header(0, 'Content-Type')).toBe('application/json');
    expect(fetchMock.mock.calls[0][1].body).toBe('{"name":"Nubank"}');
  });

  it('leaves the content type out when there is no body, or the server answers 400', async () => {
    fetchMock.mockResolvedValue(reply(204));

    expect(await api('DELETE', '/v1/transactions/3')).toBeUndefined();
    expect(header(0, 'Content-Type')).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it('sends no token to the routes that ask for none', async () => {
    fetchMock.mockResolvedValue(reply(200, {}));

    await api('POST', '/v1/auth/login', { body: { email: 'a@b.c', password: 'x' }, auth: false });

    expect(header(0, 'Authorization')).toBeUndefined();
  });

  it('sends the idempotency key when one is given', async () => {
    fetchMock.mockResolvedValue(reply(201, {}));

    await api('POST', '/v1/transactions', { body: {}, idempotencyKey: newIdempotencyKey() });

    expect(header(0, 'Idempotency-Key')).toBe('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d');
  });
});

describe('errors', () => {
  it('turns an error answer into an ApiError with its code, message and fields', async () => {
    fetchMock.mockResolvedValue(
      reply(400, {
        error: {
          code: 'validation_failed',
          message: 'Dados inválidos.',
          fields: [{ path: 'amount', message: 'O valor precisa ser maior que zero.' }],
        },
      })
    );

    const error = await api('POST', '/v1/transactions', { body: {} }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'validation_failed',
      message: 'Dados inválidos.',
      fields: [{ path: 'amount', message: 'O valor precisa ser maior que zero.' }],
    });
  });

  it('survives an error answer that is not JSON', async () => {
    fetchMock.mockResolvedValue({
      status: 502,
      ok: false,
      json: async () => {
        throw new SyntaxError('not json');
      },
    });

    await expect(api('GET', '/v1/cards')).rejects.toMatchObject({ status: 502, code: 'unknown' });
  });

  it('asks for an update on 426', async () => {
    fetchMock.mockResolvedValue(reply(426, { error: { code: 'upgrade_required', message: 'Atualize o app.' } }));

    await expect(api('GET', '/v1/cards')).rejects.toMatchObject({ status: 426, code: 'upgrade_required' });
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('is a NetworkError, and keeps the session, when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(api('GET', '/v1/cards')).rejects.toBeInstanceOf(NetworkError);
    expect(onExpired).not.toHaveBeenCalled();
    expect(await getAccessToken()).toBe('access-1');
    expect(await getRefreshToken()).toBe('refresh-1');
  });

  it('is a NetworkError when the server takes too long', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementation(
        (_url: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener('abort', () => reject(new Error('aborted')));
          })
      );

      const pending = api('GET', '/v1/cards').catch((e) => e);
      await jest.advanceTimersByTimeAsync(25_000);

      expect(await pending).toBeInstanceOf(NetworkError);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('renewing the session', () => {
  // The token the server accepts: whatever a refresh handed out last.
  function serverWithExpiredToken() {
    let refreshes = 0;
    fetchMock.mockImplementation(async (url: string, init: { headers: Record<string, string> }) => {
      if (url.endsWith('/v1/auth/refresh')) {
        refreshes += 1;
        return reply(200, { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 });
      }
      return init.headers.Authorization === 'Bearer access-2' ? reply(200, { ok: true }) : unauthorized();
    });
    return { refreshes: () => refreshes };
  }

  it('renews once for calls that find the token expired together, and saves both new tokens', async () => {
    const server = serverWithExpiredToken();

    const results = await Promise.all([api('GET', '/v1/cards'), api('GET', '/v1/goals'), api('GET', '/v1/recurrences')]);

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }]);
    expect(server.refreshes()).toBe(1);
    expect(await getAccessToken()).toBe('access-2');
    expect(await getRefreshToken()).toBe('refresh-2');
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('sends the call again only once', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/v1/auth/refresh')
        ? reply(200, { accessToken: 'access-2', refreshToken: 'refresh-2', expiresIn: 900 })
        : unauthorized()
    );

    await expect(api('GET', '/v1/cards')).rejects.toMatchObject({ status: 401, code: 'unauthorized' });

    // the call, the renewal, the call again: no loop
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('sends again without renewing when another call renewed the token meanwhile', async () => {
    let calls = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/v1/auth/refresh')) throw new Error('should not renew');
      calls += 1;
      if (calls === 1) {
        // the token changes while this call is on its way, and it comes back 401 for the old one
        await saveSession({ accessToken: 'access-2', refreshToken: 'refresh-2' });
        return unauthorized();
      }
      return reply(200, { ok: true });
    });

    await expect(api('GET', '/v1/cards')).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(header(1, 'Authorization')).toBe('Bearer access-2');
  });

  it('keeps the idempotency key when the call is sent again', async () => {
    serverWithExpiredToken();

    await api('POST', '/v1/transactions', { body: { name: 'x' }, idempotencyKey: 'key-12345678' });

    const posts = fetchMock.mock.calls.filter(([url]) => url.endsWith('/v1/transactions'));
    expect(posts).toHaveLength(2);
    expect(posts.map(([, init]) => init.headers['Idempotency-Key'])).toEqual(['key-12345678', 'key-12345678']);
  });

  it('ends the session, once, when the renewal is refused', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/v1/auth/refresh')
        ? reply(401, { error: { code: 'invalid_refresh_token', message: 'Sessão expirada. Entre de novo.' } })
        : unauthorized()
    );

    const results = await Promise.allSettled([api('GET', '/v1/cards'), api('GET', '/v1/goals')]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });

  it('ends the session when there is no refresh token to renew with', async () => {
    fetchMock.mockResolvedValue(unauthorized());
    const SecureStore = jest.requireMock('expo-secure-store');
    SecureStore.__store.delete('refreshToken');

    await expect(api('GET', '/v1/cards')).rejects.toMatchObject({ status: 401 });

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('keeps the session when there is no signal to renew it', async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/v1/auth/refresh')) throw new TypeError('Network request failed');
      return unauthorized();
    });

    await expect(api('GET', '/v1/cards')).rejects.toBeInstanceOf(NetworkError);

    expect(onExpired).not.toHaveBeenCalled();
    expect(await getRefreshToken()).toBe('refresh-1');
  });

  it('keeps the session when the renewal fails on the server', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/v1/auth/refresh') ? reply(500, { error: { code: 'internal_error', message: 'Erro interno.' } }) : unauthorized()
    );

    await expect(api('GET', '/v1/cards')).rejects.toMatchObject({ code: 'refresh_failed' });

    expect(onExpired).not.toHaveBeenCalled();
    expect(await getRefreshToken()).toBe('refresh-1');
  });

  it('never renews for a 401 of the auth routes', async () => {
    fetchMock.mockResolvedValue(reply(401, { error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' } }));

    await expect(
      api('POST', '/v1/auth/login', { body: { email: 'a@b.c', password: 'errada' }, auth: false })
    ).rejects.toMatchObject({ code: 'invalid_credentials' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onExpired).not.toHaveBeenCalled();
  });

  it('does not renew for a wrong password on a protected route (deleting the account)', async () => {
    fetchMock.mockResolvedValue(reply(401, { error: { code: 'invalid_credentials', message: 'E-mail ou senha incorretos.' } }));

    await expect(api('DELETE', '/v1/me', { body: { password: 'errada' } })).rejects.toMatchObject({
      code: 'invalid_credentials',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onExpired).not.toHaveBeenCalled();
    expect(await getAccessToken()).toBe('access-1');
  });
});
