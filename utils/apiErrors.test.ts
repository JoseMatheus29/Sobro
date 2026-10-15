import { ApiError, NetworkError } from '@/api/errors';
import { errorToast } from './apiErrors';

describe('errorToast', () => {
  it('tells about a missing connection', () => {
    expect(errorToast(new NetworkError(), 'Não foi possível salvar')).toMatchObject({
      type: 'error',
      title: 'Sem conexão',
      message: 'Sem conexão. Tente de novo.',
    });
  });

  it('shows the message of a rule of the server under the title of what was being done', () => {
    const toast = errorToast(new ApiError(409, 'last_card', 'Você precisa manter pelo menos uma conta.'), 'Não foi possível excluir');
    expect(toast).toMatchObject({ title: 'Não foi possível excluir', message: 'Você precisa manter pelo menos uma conta.' });
  });

  it('asks to wait on too many tries', () => {
    expect(errorToast(new ApiError(429, 'rate_limited', 'Muitas tentativas. Tente de novo em alguns minutos.'))).toMatchObject({
      title: 'Muitas tentativas',
      message: 'Muitas tentativas. Tente de novo em alguns minutos.',
    });
  });

  it('does not show the text of a server failure', () => {
    expect(errorToast(new ApiError(500, 'internal_error', 'Erro interno.'))).toMatchObject({
      title: 'Erro no servidor',
      message: 'Tente de novo em instantes.',
    });
  });

  it('falls back to the title for anything else', () => {
    expect(errorToast(new Error('boom'), 'Não foi possível entrar')).toEqual({
      type: 'error',
      title: 'Não foi possível entrar',
      icon: 'error-outline',
    });
  });
});
