/** Parses an API date, returning null when it is missing or invalid. */
export function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = typeof value === 'string' ? new Date(value) : value;
  return isNaN(date.getTime()) ? null : date;
}
