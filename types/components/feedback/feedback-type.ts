import { type Animated, type ViewStyle } from 'react-native';

import { palette, type Palette } from '@/constants/palette';
import { tint } from '@/utils/color';

export type FeedbackType = 'success' | 'error' | 'info';

export interface ToastOptions {
  type: FeedbackType;
  title: string;
  message?: string;
  /** MaterialIcons name for what was saved; defaults to the icon of the type. */
  icon?: string;
}

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button and a trash icon, for actions that cannot be undone. */
  destructive?: boolean;
}

export interface FeedbackContextValue {
  showToast: (options: ToastOptions) => void;
  /** Resolves true when the person confirms, false when they cancel or dismiss. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export interface ToastProps {
  toast: ToastOptions | null;
  progress: Animated.Value;
  onPress: () => void;
}

export interface ConfirmDialogProps {
  request: ConfirmOptions | null;
  onAnswer: (confirmed: boolean) => void;
}

// `color` is the icon color and `tint` the soft square behind it, for toasts and dialogs.
export const feedbackStyles = (colors: Palette): Record<FeedbackType, { icon: string; color: string; tint: string }> => ({
  success: { icon: 'check', color: colors.income, tint: tint(colors.income) },
  error: { icon: 'error-outline', color: colors.expense, tint: tint(colors.expense) },
  info: { icon: 'info-outline', color: colors.primary.DEFAULT, tint: tint(colors.primary.DEFAULT) },
});

export const TOAST_DURATION_MS: Record<FeedbackType, number> = {
  success: 3500,
  info: 3500,
  error: 5000,
};
export const TOAST_SHOW_MS = 220;
export const TOAST_HIDE_MS = 180;
export const TOAST_TOP_GAP = 12;
export const TOAST_SIDE_MARGIN = 20;
export const TOAST_SLIDE_DISTANCE = -80;
export const TOAST_SHADOW: ViewStyle = {
  shadowColor: palette.primary.DEFAULT,
  shadowOpacity: 0.18,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
};

export const DIALOG_DIM_COLOR = 'rgba(26,43,74,0.5)';
// How wide a dialog gets: on a phone it is the screen minus its margins, on a computer's window it stays a card.
export const DIALOG_MAX_WIDTH = 440;
export const DEFAULT_CONFIRM_LABEL = 'Confirmar';
export const DEFAULT_CANCEL_LABEL = 'Cancelar';
export const FEEDBACK_HOOK_ERROR = 'useFeedback must be used inside <FeedbackProvider>';
