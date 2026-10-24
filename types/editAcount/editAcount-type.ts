import { type ConfirmOptions, type ToastOptions } from '@/types/components/feedback/feedback-type';
import { type BackupSummary } from '@/utils/backup-type';
import { type ThemePreference } from '@/utils/theme-type';

export interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  icon: string;
  keyboardType?: any;
  secure?: boolean;
  autoCapitalize?: any;
  /** What is wrong with the value, shown under the field. */
  error?: string;
  /** Lets the keyboard and the password manager know what is being typed (`email`, `password`, `new-password`…). */
  autoComplete?: any;
  maxLength?: number;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
}

export const PROFILE_SAVED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Perfil atualizado',
  message: 'Nome, moeda e orçamento salvos.',
  icon: 'person',
};
// The page of a profile of someone else has its own budget card.
export const BUDGET_CARD_TITLE = 'Orçamento mensal';
export const BUDGET_SAVE_LABEL = 'Salvar orçamento';
export const BUDGET_SAVED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Orçamento salvo',
  icon: 'account-balance-wallet',
};
// The budget applies from the current month on; the months already over keep the one they had.
export const BUDGET_HINT = 'Vale a partir deste mês. Os meses anteriores mantêm o orçamento que tinham.';

// Backup: everything is in the account, and it can be saved to a file and brought back.
export const BACKUP_TITLE = 'Seus dados';
export const BACKUP_TEXT =
  'Seus dados ficam na sua conta, em qualquer aparelho. Exporte uma cópia para guardar em outro lugar, ou importe um backup para trocar tudo o que está na conta.';
// The same card on the page of a profile of someone else: the backup is of that profile alone.
export const BACKUP_TITLE_OF = (name: string) => `Dados de ${name}`;
export const BACKUP_TEXT_OF = (name: string) =>
  `Os dados de ${name} ficam na sua conta, em qualquer aparelho. Exporte uma cópia para guardar em outro lugar, ou importe um backup para trocar tudo o que está neste perfil.`;
export const EXPORT_LABEL = 'Exportar backup';
export const IMPORT_LABEL = 'Importar backup';
export const EXPORT_UNAVAILABLE_TOAST: ToastOptions = {
  type: 'error',
  title: 'Não foi possível compartilhar',
  message: 'Este aparelho não tem como salvar ou compartilhar arquivos.',
  icon: 'error-outline',
};
export const EXPORT_FAILED_TOAST: ToastOptions = {
  type: 'error',
  title: 'Não foi possível gerar o backup',
  message: 'Tente de novo. Se continuar, reinicie o app.',
  icon: 'error-outline',
};
export const IMPORT_REFUSED_TITLE = 'Backup não importado';
export const IMPORT_FAILED_TOAST: ToastOptions = {
  type: 'error',
  title: 'Não foi possível importar',
  message: 'Nada foi alterado. Tente de novo com o arquivo do backup.',
  icon: 'error-outline',
};
export const IMPORT_DONE_TOAST: ToastOptions = {
  type: 'success',
  title: 'Backup importado',
  message: 'Seus dados foram restaurados.',
  icon: 'backup',
};
// `profileName` is given when the backup goes into a profile of someone else instead of the person's own account.
export const IMPORT_CONFIRM = (summary: BackupSummary, date: string, profileName?: string): ConfirmOptions => ({
  title: profileName ? `Substituir os dados de ${profileName}?` : 'Substituir seus dados?',
  message:
    `Backup de ${date}: ${summary.transactions} transações, ${summary.cards} contas, ${summary.categories} categorias` +
    ` e ${summary.recurrences} recorrências. Tudo o que está ${profileName ? `no perfil de ${profileName}` : 'na sua conta'} agora será substituído. ` +
    'Exporte antes se quiser guardar os dados atuais.',
  confirmLabel: 'Substituir',
  destructive: true,
});

// Light / dark: applies as soon as it is tapped, without waiting for the save button.
export const THEME_LABEL = 'Aparência';
export const THEME_HINT = 'Automático segue o modo claro ou escuro do celular.';
export const THEME_OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'Automático', icon: 'brightness-auto' },
  { value: 'light', label: 'Claro', icon: 'light-mode' },
  { value: 'dark', label: 'Escuro', icon: 'dark-mode' },
];

// Reminders of what is about to fall due (recurring expenses).
export const REMINDERS_LABEL = 'Lembretes de vencimento';
export const REMINDERS_HINT = 'Avisa na manhã anterior, às 9h, das contas e parcelas que vencem no dia seguinte.';
export const REMINDERS_DENIED_TOAST: ToastOptions = {
  type: 'error',
  title: 'Notificações desativadas',
  message: 'Permita as notificações do app nas configurações do celular para receber os lembretes.',
  icon: 'notifications-off',
};

// The account: leaving this phone, or deleting everything.
export const ACCOUNT_TITLE = 'Conta';
export const ACCOUNT_TEXT = 'Saia deste aparelho ou apague a conta com todos os dados.';
// Deleting the account takes the profiles of other people it cares for along; the person is told how many.
export const ACCOUNT_PROFILES_TEXT = (count: number) =>
  count === 1 ? ' O perfil que você cuida é apagado junto.' : ` Os ${count} perfis que você cuida são apagados juntos.`;
export const DELETE_ACCOUNT_PROFILES_NOTE = (count: number) =>
  count === 1
    ? ' O perfil que você cuida também será apagado, com todos os dados dele.'
    : ` Os ${count} perfis que você cuida também serão apagados, com todos os dados deles.`;
export const SIGN_OUT_LABEL = 'Sair da conta';
export const SIGN_OUT_CONFIRM: ConfirmOptions = {
  title: 'Sair da conta?',
  message: 'Você vai precisar entrar de novo para ver os seus dados neste aparelho.',
  confirmLabel: 'Sair',
};
export const DELETE_ACCOUNT_LABEL = 'Excluir minha conta';
export const DELETE_ACCOUNT_CONFIRM: ConfirmOptions = {
  title: 'Excluir a sua conta?',
  message:
    'Contas, transações, recorrências, caixinhas e orçamentos serão apagados de vez, em qualquer aparelho. ' +
    'Isso não pode ser desfeito. Exporte um backup antes, se quiser guardar os dados.',
  confirmLabel: 'Continuar',
  destructive: true,
};
export const DELETE_MODAL_TITLE = 'Confirme com a sua senha';
export const DELETE_MODAL_TEXT = 'Por segurança, digite a senha da conta para excluí-la.';
export const DELETE_PASSWORD_LABEL = 'Senha';
export const DELETE_PASSWORD_REQUIRED = 'Digite a senha.';
export const DELETE_SUBMIT_LABEL = 'Excluir conta';
export const DELETE_SUBMITTING_LABEL = 'Excluindo...';
export const DELETE_CANCEL_LABEL = 'Cancelar';
export const DELETE_FAILED_TITLE = 'Não foi possível excluir a conta';
export const ACCOUNT_DELETED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Conta excluída',
  message: 'Todos os seus dados foram apagados.',
  icon: 'delete-outline',
};
export const PROFILE_SAVE_FAILED_TITLE = 'Não foi possível salvar o perfil';
