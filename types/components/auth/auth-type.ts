import { type ToastOptions } from '@/types/components/feedback/feedback-type';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export interface AuthContextValue {
  /** `loading` while the tokens are read from the secure store; the screens only choose after that. */
  status: AuthStatus;
  /** The server asked for a newer version of the app (426): nothing else works until it is updated. */
  upgradeRequired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Deletes the account and everything in it. Rejects with the server's error (a wrong password is 401). */
  deleteAccount: (password: string) => Promise<void>;
}

export const AUTH_HOOK_ERROR = 'useAuth must be used inside <AuthProvider>';

// The only routes there is to see without a session; everything else sends the person to the login.
export const PUBLIC_ROUTES = ['login', 'register', 'forgot', 'reset'];

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 100;

export const SESSION_EXPIRED_TOAST: ToastOptions = {
  type: 'info',
  title: 'Sua sessão terminou',
  message: 'Entre de novo para continuar.',
  icon: 'lock-outline',
};

// Shared by the screens that have a form.
export const EMAIL_LABEL = 'E-mail';
export const EMAIL_PLACEHOLDER = 'voce@email.com';
export const PASSWORD_LABEL = 'Senha';
export const PASSWORD_PLACEHOLDER = 'Mínimo de 8 caracteres';
export const EMAIL_INVALID_MESSAGE = 'Digite um e-mail válido.';
export const PASSWORD_REQUIRED_MESSAGE = 'Digite a senha.';
export const PASSWORD_SHORT_MESSAGE = `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
export const PASSWORD_LONG_MESSAGE = `A senha pode ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
export const PASSWORDS_DIFFER_MESSAGE = 'As senhas não são iguais.';
export const BACK_TO_LOGIN_LABEL = 'Voltar para entrar';

// Routes of the screens without a session, and where a session goes to.
export const LOGIN_ROUTE = '/login';
export const REGISTER_ROUTE = '/register';
export const FORGOT_ROUTE = '/forgot';
export const RESET_ROUTE = '/reset';
export const HOME_ROUTE = '/dashboard';

// The server asked for a newer app.
export const UPGRADE_TITLE = 'Atualize o app';
export const UPGRADE_MESSAGE = 'Esta versão do Sobrô? é antiga demais para falar com o servidor. Atualize para continuar.';
export const UPGRADE_BUTTON = 'Abrir a Play Store';
export const playStoreUrl = (packageName: string) => `https://play.google.com/store/apps/details?id=${packageName}`;
export const AUTH_BOTTOM_PADDING = 32;
export const AUTH_LOGO_SIZE = 72;
