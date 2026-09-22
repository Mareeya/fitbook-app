import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: HttpErrorResponse, fallback: string): string {
  if (error.status === 0) {
    return 'Cannot connect to the API. Please make sure the backend is running.';
  }

  if (typeof error.error === 'string' && error.error) {
    return error.error;
  }

  const problemDetail = error.error?.detail;
  if (typeof problemDetail === 'string' && problemDetail) {
    return problemDetail;
  }

  if (error.status === 401) {
    return 'Please log in again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to do that.';
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
