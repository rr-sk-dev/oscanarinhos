/**
 * A log-safe summary of a failure: only its message and HTTP status code. Never log the error
 * itself: a web-push error carries the subscription endpoint (a bearer-like secret) in its
 * properties, and stacks or bodies may hold recipients' addresses.
 */
export function describeError(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return 'unknown error';
  }

  const { message, statusCode } = error as { message?: unknown; statusCode?: unknown };
  const status = typeof statusCode === 'number' ? `status ${statusCode}` : null;
  const text = typeof message === 'string' && message !== '' ? message : null;

  if (text && status) {
    return `${text} (${status})`;
  }
  return text ?? status ?? 'unknown error';
}
