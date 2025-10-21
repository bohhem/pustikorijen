import { ZodError } from 'zod';

export function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '';
}
