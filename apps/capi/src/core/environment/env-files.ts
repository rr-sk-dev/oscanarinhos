import { readFileSync } from 'node:fs';

/**
 * Resolves `${KEY}_FILE` indirections (Docker/Compose secrets).
 *
 * For every key in `keys`, if `${KEY}_FILE` is set, the file is read (utf8,
 * trailing newlines stripped) and its content is used as `KEY`.
 * Setting both `KEY` and `${KEY}_FILE` is an error. Error messages never
 * include the file contents.
 *
 * Kept dependency-free: it is also imported by prisma.config.ts (Prisma CLI).
 */
export function resolveFileEnv<T extends Record<string, unknown>, K extends string>(
  env: T,
  keys: readonly K[],
): T & Partial<Record<K, string>> {
  const resolved: Record<string, unknown> = { ...env };

  for (const key of keys) {
    const fileKey = `${key}_FILE`;
    const filePath = env[fileKey];

    if (!isSet(filePath)) continue;

    if (isSet(env[key])) {
      throw new Error(
        `Environment variables ${key} and ${fileKey} are both set; use only one of them.`,
      );
    }

    let content: string;
    try {
      content = readFileSync(String(filePath), 'utf8');
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code ?? 'unknown error';
      throw new Error(`Cannot read the file referenced by ${fileKey} (${code}).`);
    }

    resolved[key] = content.replace(/[\r\n]+$/, '');
  }

  return resolved as T & Partial<Record<K, string>>;
}

function isSet(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}
