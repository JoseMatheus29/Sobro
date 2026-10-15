import { ApiError, NetworkError, fieldErrors, isApiError, isNetworkError } from './errors';

describe('errors', () => {
  it('can be told apart', () => {
    expect(isApiError(new ApiError(400, 'x', 'y'))).toBe(true);
    expect(isApiError(new NetworkError())).toBe(false);
    expect(isNetworkError(new NetworkError())).toBe(true);
    expect(isNetworkError(new Error('x'))).toBe(false);
  });

  it('keeps the status, the code and the fields', () => {
    const error = new ApiError(400, 'validation_failed', 'Dados inválidos.', [{ path: 'email', message: 'E-mail inválido.' }]);
    expect(error).toMatchObject({ status: 400, code: 'validation_failed', message: 'Dados inválidos.' });
    expect(error.fields).toEqual([{ path: 'email', message: 'E-mail inválido.' }]);
  });
});

describe('fieldErrors', () => {
  it('maps each field to its message, the first one winning', () => {
    const error = new ApiError(400, 'validation_failed', 'Dados inválidos.', [
      { path: 'email', message: 'E-mail inválido.' },
      { path: 'password', message: 'Senha curta.' },
      { path: 'email', message: 'Outra.' },
    ]);
    expect(fieldErrors(error)).toEqual({ email: 'E-mail inválido.', password: 'Senha curta.' });
  });

  it('is empty without fields, and for what is not an ApiError', () => {
    expect(fieldErrors(new ApiError(409, 'email_taken', 'x'))).toEqual({});
    expect(fieldErrors(new NetworkError())).toEqual({});
    expect(fieldErrors(null)).toEqual({});
  });
});
