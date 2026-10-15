import { type ToastOptions } from '@/types/components/feedback/feedback-type';

export const FORGOT_TITLE = 'Recuperar senha';
export const FORGOT_SUBTITLE = 'Enviamos um link para você criar uma nova senha.';
export const FORGOT_BUTTON = 'Enviar link';
export const FORGOT_BUSY_BUTTON = 'Enviando...';
export const FORGOT_FAILED_TITLE = 'Não foi possível enviar o link';
// The server answers the same whether or not the e-mail has an account, so the screen does too.
export const FORGOT_SENT_TOAST: ToastOptions = {
  type: 'success',
  title: 'Verifique seu e-mail',
  message: 'Se houver uma conta com esse e-mail, enviamos um link para criar uma nova senha.',
  icon: 'mark-email-read',
};
export const FORGOT_SENT_TEXT = 'Abra o link que enviamos e depois informe o código aqui para criar a nova senha.';
export const HAVE_CODE_BUTTON = 'Já tenho o link';
export const SEND_AGAIN_BUTTON = 'Enviar de novo';
