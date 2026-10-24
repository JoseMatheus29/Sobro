import { type ManagedProfile } from '@/db/profiles';
import { type ToastOptions } from '@/types/components/feedback/feedback-type';

// Managed profiles: someone else's finances (a mother's, say), looked after from the person's own account. The
// server holds each one apart (docs/api-perfis.md); the app only names which one a call is about.

/** How many profiles of other people one account can care for (the server refuses the next one: 409 `profile_limit`). */
export const MAX_MANAGED_PROFILES = 5;
export const PROFILE_NAME_MAX_LENGTH = 60;

export interface ProfilesContextValue {
  /** The profiles of other people the account cares for, oldest first. Empty for someone who has none. */
  profiles: ManagedProfile[];
  /** The one being looked at; null when it is the person's own. */
  active: ManagedProfile | null;
  /** The list is still being read for the first time. */
  loading: boolean;
  /** Looks at another profile (null: the person's own) and goes back to the Home, with nothing of the last one left. */
  switchTo: (id: string | null) => void;
  /** Opens the dialog that creates one. */
  openCreate: () => void;
  /** Makes one (`key` is the idempotency key of the attempt). It is not opened: the dialog decides what comes next. */
  create: (name: string, key: string) => Promise<ManagedProfile>;
  rename: (id: string, name: string) => Promise<ManagedProfile>;
  /** Deletes it with all its data; the password is the person's own. If it was open, the person's own comes back. */
  remove: (id: string, password: string) => Promise<void>;
}

export const PROFILES_HOOK_ERROR = 'useProfiles must be used inside <ProfileProvider>';

export interface ProfileFormModalProps {
  visible: boolean;
  /** The profile being renamed; null makes a new one. */
  profile: ManagedProfile | null;
  onClose: () => void;
  /** After it was made or renamed. */
  onSaved: (profile: ManagedProfile) => void;
}

export interface DeleteProfileModalProps {
  visible: boolean;
  /** The profile to delete. Kept while the dialog fades out, so its text does not change under the person's eyes. */
  profile: ManagedProfile | null;
  onClose: () => void;
}

export interface NoAccountsCardProps {
  /** The profile that has no accounts yet. */
  name: string;
  onCreate: () => void;
  onImport: () => void;
}

export interface ProfileSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

// A dialog opened right after a sheet closed is dropped by iOS if it comes before the sheet is gone.
export const MODAL_HANDOFF_MS = 300;

export interface ProfileAvatarProps {
  name: string;
  /** Side in px. */
  size: number;
  /** A profile of someone else (the purple one) or the person's own (the brand blue). */
  managed: boolean;
}

// The strip that stays on top of every screen while another person's finances are open.
export const BANNER_SEEING_LABEL = 'Você está vendo';
export const BANNER_TITLE = (name: string) => `Finanças de ${name}`;
export const BANNER_BACK_LABEL = 'Voltar para as minhas';
export const BANNER_BACK_ACCESSIBILITY = 'Voltar para as minhas finanças';
export const BANNER_MIN_HEIGHT = 64;

// The chip of the Home and the sheet it opens.
export const CHIP_ACCESSIBILITY = (name: string) => `Trocar de perfil. Perfil atual: ${name}`;
export const SWITCHER_TITLE = 'Trocar de perfil';
export const SWITCHER_TEXT = 'Cada perfil tem as suas próprias contas, lançamentos e caixinhas.';
export const SWITCHER_OWN_SECTION = 'Seu perfil';
export const SWITCHER_MANAGED_SECTION = 'Perfis que você cuida';
export const SWITCHER_CLOSE_LABEL = 'Fechar';
export const ADD_PROFILE_LABEL = 'Adicionar perfil';
export const PROFILES_COUNT_LABEL = (count: number) => `${count} de ${MAX_MANAGED_PROFILES} perfis`;
export const PROFILES_COUNT_SHORT = (count: number) => `${count} de ${MAX_MANAGED_PROFILES}`;

// Creating and renaming.
export const NEW_PROFILE_TITLE = 'Novo perfil';
export const NEW_PROFILE_TEXT =
  'Para cuidar das finanças de outra pessoa, como a sua mãe. Ela não precisa ter conta nem senha: você vê e registra tudo por aqui.';
export const NEW_PROFILE_NOTE = (count: number) =>
  `Cadastre só quem concordou com isso. Você tem ${count} de ${MAX_MANAGED_PROFILES} perfis e pode apagar qualquer um quando quiser.`;
export const RENAME_PROFILE_TITLE = 'Renomear perfil';
export const PROFILE_NAME_LABEL = 'Nome do perfil';
export const PROFILE_NAME_PLACEHOLDER = 'Ex.: Mãe';
export const PROFILE_NAME_REQUIRED = 'Digite o nome do perfil.';
export const PROFILE_CANCEL_LABEL = 'Cancelar';
export const PROFILE_CREATE_LABEL = 'Criar perfil';
export const PROFILE_CREATING_LABEL = 'Criando...';
export const PROFILE_RENAME_LABEL = 'Salvar';
export const PROFILE_RENAMING_LABEL = 'Salvando...';
export const PROFILE_SAVE_FAILED_MESSAGE = 'Não foi possível salvar o perfil.';
export const PROFILE_CREATED_TOAST = (name: string): ToastOptions => ({
  type: 'success',
  title: 'Perfil criado',
  message: `Você está vendo as finanças de ${name}.`,
  icon: 'person-add',
});
export const PROFILE_RENAMED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Perfil renomeado',
  icon: 'edit',
};

// The card in Perfil.
export const PROFILES_CARD_TITLE = 'Perfis que você cuida';
export const PROFILES_CARD_TEXT =
  'Veja e registre as finanças de outra pessoa sem sair da sua conta. Cada perfil tem as suas próprias contas e lançamentos.';
export const PROFILES_CARD_EMPTY = 'Você ainda não cuida de nenhum perfil.';
export const PROFILE_OPEN_LABEL = 'Ver';
export const PROFILE_OPEN_ACCESSIBILITY = (name: string) => `Ver as finanças de ${name}`;
export const PROFILE_MENU_ACCESSIBILITY = (name: string) => `Mais opções de ${name}`;
export const PROFILE_MENU_RENAME = 'Renomear';
export const PROFILE_MENU_DELETE = 'Excluir perfil';
export const PROFILE_LIMIT_HINT = `Você já cuida de ${MAX_MANAGED_PROFILES} perfis. Exclua um para adicionar outro.`;

// Deleting: the password is the person's own, the profile has none.
export const DELETE_PROFILE_TITLE = (name: string) => `Excluir o perfil ${name}?`;
export const DELETE_PROFILE_TEXT = (name: string) =>
  `Todas as contas, lançamentos, caixinhas e orçamentos de ${name} serão apagados para sempre. Não dá para desfazer.`;
export const DELETE_PROFILE_PASSWORD_LABEL = 'Sua senha';
export const DELETE_PROFILE_PASSWORD_HINT = (name: string) => `É a senha da sua conta. ${name} não tem senha.`;
export const DELETE_PROFILE_PASSWORD_REQUIRED = 'Digite a sua senha.';
export const DELETE_PROFILE_SUBMIT = 'Excluir perfil';
export const DELETE_PROFILE_SUBMITTING = 'Excluindo...';
export const DELETE_PROFILE_FAILED_TITLE = 'Não foi possível excluir o perfil';
export const PROFILE_DELETED_TOAST = (name: string): ToastOptions => ({
  type: 'success',
  title: 'Perfil excluído',
  message: `Os dados de ${name} foram apagados.`,
  icon: 'delete-outline',
});

// When the server stops letting the person into a profile (it was deleted, or the access is gone).
export const PROFILE_FORBIDDEN_TOAST: ToastOptions = {
  type: 'info',
  title: 'Perfil indisponível',
  message: 'Você não tem mais acesso a esse perfil. Voltamos para as suas finanças.',
  icon: 'lock-outline',
};

// The page of a profile of someone else, in Perfil.
export const MANAGED_HEADER_TITLE = (name: string) => `Perfil de ${name}`;
export const MANAGED_CARD_TITLE = 'Gerenciar perfil';
export const MANAGED_CARD_TEXT = (name: string) =>
  `Você está cuidando das finanças de ${name}. O orçamento e o backup desta página são só deste perfil.`;

// A Home with nothing in it yet: a new profile has no accounts.
export const NO_ACCOUNTS_TITLE = (name: string) => `${name} ainda não tem contas`;
export const NO_ACCOUNTS_TEXT =
  'Uma conta é onde o dinheiro está: um banco, um cartão ou dinheiro em mãos. Crie a primeira para começar a registrar entradas e saídas.';
export const NO_ACCOUNTS_CREATE_LABEL = 'Criar a primeira conta';
export const NO_ACCOUNTS_IMPORT_LABEL = 'Importar um backup para este perfil';

// The new transaction, the tag of whose it is.
export const TRANSACTION_FOR_LABEL = (name: string) => `Para: ${name}`;
