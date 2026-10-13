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
}

export const PROFILE_SAVED_TOAST: ToastOptions = {
  type: 'success',
  title: 'Perfil atualizado',
  message: 'Nome, moeda e orçamento salvos.',
  icon: 'person',
};
// The budget applies from the current month on; the months already over keep the one they had.
export const BUDGET_HINT = 'Vale a partir deste mês. Os meses anteriores mantêm o orçamento que tinham.';

// Backup: everything lives only on this device, so it can be saved to a file and brought back.
export const BACKUP_TITLE = 'Seus dados';
export const BACKUP_TEXT =
  'Tudo fica só neste aparelho. Exporte um backup para guardar em outro lugar ou levar para outro celular.';
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
export const IMPORT_CONFIRM = (summary: BackupSummary, date: string): ConfirmOptions => ({
  title: 'Substituir seus dados?',
  message:
    `Backup de ${date}: ${summary.transactions} transações, ${summary.cards} contas, ${summary.categories} categorias` +
    ` e ${summary.recurrences} recorrências. Tudo o que está no app agora será substituído. ` +
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
