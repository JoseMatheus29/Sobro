import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/types/components/auth/auth-type';

// Enough to catch a typo before the trip to the server, which has the last word.
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type PasswordProblem = 'short' | 'long' | null;

export function passwordProblem(password: string): PasswordProblem {
  if (password.length < PASSWORD_MIN_LENGTH) return 'short';
  if (password.length > PASSWORD_MAX_LENGTH) return 'long';
  return null;
}

// The token in a link of the e-mail, which carries it after `#token=`; null when the text is not such a link.
export function findResetToken(text: string): string | null {
  const found = /[#?&]token=([^&#\s]+)/.exec(text);
  return found ? decodeURIComponent(found[1]) : null;
}

// A person may paste the whole link or only the token, so both come out the same.
export function extractResetToken(text: string): string {
  return findResetToken(text) ?? text.trim();
}
