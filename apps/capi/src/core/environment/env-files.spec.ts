import 'reflect-metadata';
import * as fs from 'node:fs';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveFileEnv } from './env-files';
import { validateFn } from './env-validator';

const SECRET = 's3cr3t-value-that-must-not-leak';

const baseEnv = {
  NODE_ENV: 'production',
  PORT: '3000',
  R2_ACCOUNT_ID: 'account',
  R2_ACCESS_KEY_ID: 'access-key',
  R2_SECRET_ACCESS_KEY: 'secret-key',
  R2_PUBLIC_URL: 'https://images.example.com',
  R2_BUCKET_NAME: 'bucket',
  YOUTUBE_API_KEY: 'yt-key',
  YOUTUBE_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  YOUTUBE_CHANNEL_HANDLE: '@channel',
};

describe('resolveFileEnv', () => {
  let dir: string;
  let secretFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'env-files-'));
    secretFile = join(dir, 'secret');
    writeFileSync(secretFile, `${SECRET}\n`);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('uses the file content (without trailing newline) when KEY_FILE is set', () => {
    const result = resolveFileEnv({ POSTGRES_URL_FILE: secretFile }, ['POSTGRES_URL']);

    expect(result.POSTGRES_URL).toBe(SECRET);
  });

  it('strips CRLF line endings too', () => {
    writeFileSync(secretFile, `${SECRET}\r\n`);

    const result = resolveFileEnv({ POSTGRES_URL_FILE: secretFile }, ['POSTGRES_URL']);

    expect(result.POSTGRES_URL).toBe(SECRET);
  });

  it('keeps plain variables untouched when no KEY_FILE is set', () => {
    const result = resolveFileEnv({ POSTGRES_URL: 'postgres://plain' }, ['POSTGRES_URL']);

    expect(result.POSTGRES_URL).toBe('postgres://plain');
  });

  it('does not mutate the input object', () => {
    const env = { POSTGRES_URL_FILE: secretFile };

    resolveFileEnv(env, ['POSTGRES_URL']);

    expect(env).toEqual({ POSTGRES_URL_FILE: secretFile });
  });

  it('only resolves the given keys', () => {
    const result = resolveFileEnv({ OTHER_FILE: secretFile }, ['POSTGRES_URL']);

    expect(result).not.toHaveProperty('OTHER');
  });

  it('throws when both KEY and KEY_FILE are set', () => {
    expect(() =>
      resolveFileEnv({ POSTGRES_URL: 'postgres://plain', POSTGRES_URL_FILE: secretFile }, [
        'POSTGRES_URL',
      ]),
    ).toThrow(/POSTGRES_URL and POSTGRES_URL_FILE are both set/);
  });

  it('throws naming the variable when the file does not exist', () => {
    const missing = join(dir, 'missing');

    expect(() => resolveFileEnv({ POSTGRES_URL_FILE: missing }, ['POSTGRES_URL'])).toThrow(
      /POSTGRES_URL_FILE.*ENOENT/,
    );
  });

  it('never includes the file contents (or the underlying error message) in the error', () => {
    const err = Object.assign(new Error(`boom: ${SECRET}`), { code: 'EIO' });
    const spy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw err;
    });

    try {
      let message = '';
      try {
        resolveFileEnv({ POSTGRES_URL_FILE: secretFile }, ['POSTGRES_URL']);
      } catch (e) {
        message = (e as Error).message;
      }
      expect(message).toMatch(/POSTGRES_URL_FILE.*EIO/);
      expect(message).not.toContain(SECRET);
    } finally {
      spy.mockRestore();
    }
  });

  it('throws naming the variable when the path is a directory', () => {
    expect(() => resolveFileEnv({ POSTGRES_URL_FILE: dir }, ['POSTGRES_URL'])).toThrow(
      /POSTGRES_URL_FILE.*EISDIR/,
    );
  });
});

describe('validateFn with *_FILE variables', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'env-validate-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads any EnvironmentVariables key from its _FILE variant', () => {
    const urlFile = join(dir, 'postgres_url');
    const ytFile = join(dir, 'youtube_api_key');
    writeFileSync(urlFile, 'postgresql://u:p@db:5432/capi\n');
    writeFileSync(ytFile, 'yt-from-file\n');
    const { YOUTUBE_API_KEY: _ignored, ...env } = baseEnv;

    const config = validateFn({
      ...env,
      POSTGRES_URL_FILE: urlFile,
      YOUTUBE_API_KEY_FILE: ytFile,
    });

    expect(config.POSTGRES_URL).toBe('postgresql://u:p@db:5432/capi');
    expect(config.YOUTUBE_API_KEY).toBe('yt-from-file');
  });

  it('rejects KEY and KEY_FILE set together', () => {
    const urlFile = join(dir, 'postgres_url');
    writeFileSync(urlFile, 'postgresql://from-file');

    expect(() =>
      validateFn({ ...baseEnv, POSTGRES_URL: 'postgresql://plain', POSTGRES_URL_FILE: urlFile }),
    ).toThrow(/both set/);
  });

  it('treats CORS_ORIGINS as optional', () => {
    const config = validateFn({ ...baseEnv, POSTGRES_URL: 'postgresql://plain' });

    expect(config.CORS_ORIGINS ?? []).toEqual([]);
  });
});
