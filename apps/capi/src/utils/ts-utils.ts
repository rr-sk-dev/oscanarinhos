/**
 * Creates a frozen enum-like object with literal type inference.
 */
export function enumOf<const T extends Record<string, string | number>>(
  obj: T,
): T {
  return Object.freeze(obj);
}

/**
 * Extracts the union type of all values in an object.
 */
export type ValueOf<T> = T[keyof T];
