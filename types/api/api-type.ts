// Constants of the HTTP layer (api/). The copy here is what a person can end up reading.

export const REQUEST_TIMEOUT_MS = 20_000;

export const NETWORK_ERROR_MESSAGE = 'Sem conexão. Tente de novo.';
export const UNKNOWN_ERROR_MESSAGE = 'Erro inesperado.';
export const REFRESH_FAILED_MESSAGE = 'Não foi possível renovar a sessão.';
export const MISSING_API_URL_MESSAGE = 'EXPO_PUBLIC_API_URL não está definida. Veja o .env.example.';

// Where the tokens are kept (expo-secure-store). Nothing else financial or personal is stored on the device.
export const ACCESS_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// An expired access token comes back as 401 with this code; any other 401 on a protected route (a wrong
// password when deleting the account) is a different answer and must not renew the session.
export const UNAUTHORIZED_CODE = 'unauthorized';

export const APP_VERSION_FALLBACK = '0.0.0';
