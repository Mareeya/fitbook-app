import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'Cannot connect to the API. Please make sure the backend is running.';
  }

  if (typeof error.error === 'string' && error.error) {
    return error.error;
  }

  const fieldErrors = error.error?.errors;
  if (fieldErrors) {
    const first = Object.values(fieldErrors)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') {
      return first[0];
    }
  }

  return fallback;
}
