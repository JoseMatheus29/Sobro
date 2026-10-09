import { type ToastOptions } from '../components/feedback/feedback-type';

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
export const PHOTO_PERMISSION_TOAST: ToastOptions = {
  type: 'error',
  title: 'Permissão necessária',
  message: 'Permita o acesso às fotos para escolher um avatar.',
  icon: 'photo-library',
};
