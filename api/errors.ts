import { NETWORK_ERROR_MESSAGE } from '@/types/api/api-type';

export interface FieldIssue {
  path: string;
  message: string;
}

// The server answered, and the answer was an error.
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: FieldIssue[]
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// The server could not be reached (no signal, or it took too long). Nothing is known to have been saved.
export class NetworkError extends Error {
  constructor(message: string = NETWORK_ERROR_MESSAGE) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const isNetworkError = (error: unknown): error is NetworkError => error instanceof NetworkError;
export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

// What `fields` says about each field of the body, by path, for the message next to the field. The first
// message of a field wins. Empty for any error that is not a validation one.
export function fieldErrors(error: unknown): Record<string, string> {
  const messages: Record<string, string> = {};
  if (!isApiError(error)) return messages;
  for (const { path, message } of error.fields ?? []) {
    if (!(path in messages)) messages[path] = message;
  }
  return messages;
}
