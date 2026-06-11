import { HttpErrorResponse } from '@angular/common/http';

export interface ApiFieldErrors {
  [field: string]: string[];
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }
    return fallback;
  }

  const body = error.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;

    if (typeof record['message'] === 'string' && record['message']) {
      return record['message'];
    }

    if (typeof record['detail'] === 'string' && record['detail']) {
      return record['detail'];
    }

    if (typeof record['title'] === 'string' && record['title'] && error.status !== 400) {
      return record['title'];
    }

    const fieldErrors = getApiFieldErrors(error);
    const messages = Object.values(fieldErrors).flat();
    if (messages.length) {
      return messages.join(' ');
    }
  }

  if (error.status === 0) {
    const message =
      typeof error.message === 'string' ? error.message.toLowerCase() : '';

    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Cannot reach the API. Check that the backend is online and CORS allows this site.';
    }

    return 'Unable to reach the server. Check that the API is running.';
  }

  if (error.status === 200 || error.status === 204) {
    const message =
      typeof error.message === 'string' ? error.message.toLowerCase() : '';

    if (message.includes('parsing') || message.includes('json')) {
      return 'The server responded, but the response could not be read. Try again after refreshing the page.';
    }
  }

  if (error.status === 401) {
    return 'Invalid email or password.';
  }

  if (error.status === 409) {
    if (body && typeof body === 'object') {
      const conflict = body as Record<string, unknown>;
      if (typeof conflict['message'] === 'string' && conflict['message']) {
        return conflict['message'];
      }
    }
    return 'This record already exists.';
  }

  if (error.status === 403) {
    if (body && typeof body === 'object') {
      const forbidden = body as Record<string, unknown>;
      if (typeof forbidden['message'] === 'string' && forbidden['message']) {
        return forbidden['message'];
      }
    }
    return 'You do not have permission to perform this action.';
  }

  if (error.status >= 500) {
    return 'Server error. Restart the API and try again.';
  }

  return fallback;
}

export function getApiFieldErrors(error: unknown): ApiFieldErrors {
  if (!(error instanceof HttpErrorResponse)) {
    return {};
  }

  const body = error.error;
  if (!body || typeof body !== 'object' || !('errors' in body)) {
    return {};
  }

  const errors = (body as { errors: unknown }).errors;
  if (!errors || typeof errors !== 'object') {
    return {};
  }

  const result: ApiFieldErrors = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      result[key] = value.map(String);
    } else if (typeof value === 'string') {
      result[key] = [value];
    }
  }
  return result;
}

export function isEnrollmentAccessDenied(error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 403 &&
    getApiErrorMessage(error).toLowerCase().includes('enrollment')
  );
}

export function getFieldError(
  fieldErrors: ApiFieldErrors,
  fieldName: string,
): string | null {
  const direct = fieldErrors[fieldName];
  if (direct?.length) {
    return direct[0];
  }

  const normalized = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  const pascal = fieldErrors[normalized];
  if (pascal?.length) {
    return pascal[0];
  }

  return null;
}
