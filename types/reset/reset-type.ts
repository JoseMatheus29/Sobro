import { type ToastOptions } from '@/types/components/feedback/feedback-type';

export const RESET_TITLE = 'Nova senha';
export const RESET_SUBTITLE = 'Cole o link que chegou no seu e-mail e escolha a nova senha.';
export const RESET_BUTTON = 'Salvar nova senha';
export const RESET_BUSY_BUTTON = 'Salvando...';
export const RESET_FAILED_TITLE = 'Não foi possível trocar a senha';
export const TOKEN_LABEL = 'Link ou código do e-mail';
export const TOKEN_PLACEHOLDER = 'Cole aqui';
export const TOKEN_REQUIRED_MESSAGE = 'Cole o link ou o código do e-mail.';
export const NEW_PASSWORD_LABEL = 'Nova senha';
export const CONFIRM_NEW_PASSWORD_LABEL = 'Repetir a nova senha';
export const INVALID_RESET_TOKEN_CODE = 'invalid_reset_token';
export const ASK_NEW_LINK_BUTTON = 'Pedir um link novo';
export const RESET_DONE_TOAST: ToastOptions = {
  type: 'success',
  title: 'Senha alterada',
  message: 'Entre com a nova senha.',
  icon: 'lock-open',
};
