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

// What `fields` says about one field of the body, for the message next to it.
export function fieldMessage(error: unknown, path: string): string | undefined {
  return isApiError(error) ? error.fields?.find((f) => f.path === path)?.message : undefined;
}
