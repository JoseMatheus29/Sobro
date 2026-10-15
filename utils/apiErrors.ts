import { isApiError, isNetworkError } from '@/api/errors';
import {
  GENERIC_ERROR_TITLE,
  NETWORK_ERROR_TITLE,
  RATE_LIMITED_TITLE,
  SERVER_ERROR_MESSAGE,
  SERVER_ERROR_TITLE,
} from '@/types/api/api-type';
import { type ToastOptions } from '@/types/components/feedback/feedback-type';

// What to tell the person when a call failed: no signal, too many tries, the server down, or a rule of the
// server (its message is already in Portuguese and says what is wrong). `fallbackTitle` names what was being done.
export function errorToast(error: unknown, fallbackTitle: string = GENERIC_ERROR_TITLE): ToastOptions {
  if (isNetworkError(error)) {
    return { type: 'error', title: NETWORK_ERROR_TITLE, message: error.message, icon: 'wifi-off' };
  }
  if (isApiError(error)) {
    if (error.status === 429) {
      return { type: 'error', title: RATE_LIMITED_TITLE, message: error.message, icon: 'hourglass-empty' };
    }
    if (error.status >= 500) {
      return { type: 'error', title: SERVER_ERROR_TITLE, message: SERVER_ERROR_MESSAGE, icon: 'cloud-off' };
    }
    return { type: 'error', title: fallbackTitle, message: error.message, icon: 'error-outline' };
  }
  return { type: 'error', title: fallbackTitle, icon: 'error-outline' };
}
