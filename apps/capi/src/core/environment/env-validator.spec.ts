import 'reflect-metadata';
import { validateFn } from './env-validator';

const baseConfig = {
  NODE_ENV: 'development',
  PORT: '3000',
  CORS_ORIGINS: 'http://localhost:4200',
  POSTGRES_URL: 'postgresql://user:password@localhost:5432/db',
  R2_ACCOUNT_ID: 'account',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_PUBLIC_URL: 'https://cdn.example.com',
  R2_BUCKET_NAME: 'bucket',
  YOUTUBE_API_KEY: 'yt',
  YOUTUBE_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  YOUTUBE_CHANNEL_HANDLE: 'handle',
  JWT_SECRET: 'a'.repeat(32),
  EMAIL_PROVIDER: 'console',
};

describe('validateFn (auth variables)', () => {
  it('accepts a console email provider without Resend keys', () => {
    expect(() => validateFn(baseConfig)).not.toThrow();
  });

  it('defaults JWT_EXPIRES_IN to 30d', () => {
    expect(validateFn(baseConfig).JWT_EXPIRES_IN).toBe('30d');
  });

  it('keeps an explicit JWT_EXPIRES_IN', () => {
    expect(validateFn({ ...baseConfig, JWT_EXPIRES_IN: '7d' }).JWT_EXPIRES_IN).toBe('7d');
  });

  it('rejects a missing JWT_SECRET', () => {
    const config: Record<string, unknown> = { ...baseConfig };
    delete config.JWT_SECRET;

    expect(() => validateFn(config)).toThrow(/JWT_SECRET/);
  });

  it('rejects a JWT_SECRET shorter than 32 characters', () => {
    expect(() => validateFn({ ...baseConfig, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('rejects an unknown EMAIL_PROVIDER', () => {
    expect(() => validateFn({ ...baseConfig, EMAIL_PROVIDER: 'smtp' })).toThrow(/EMAIL_PROVIDER/);
  });

  it('fails boot when the resend provider has no API key or sender', () => {
    expect(() => validateFn({ ...baseConfig, EMAIL_PROVIDER: 'resend' })).toThrow(
      /RESEND_API_KEY[\s\S]*EMAIL_FROM|EMAIL_FROM[\s\S]*RESEND_API_KEY/,
    );
  });

  it('accepts the resend provider when both keys are set', () => {
    expect(() =>
      validateFn({
        ...baseConfig,
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_123',
        EMAIL_FROM: 'Canarinhos <no-reply@example.com>',
      }),
    ).not.toThrow();
  });

  it('rejects the console email provider in production', () => {
    expect(() => validateFn({ ...baseConfig, NODE_ENV: 'production' })).toThrow(
      /EMAIL_PROVIDER.*resend/,
    );
  });

  it('accepts the resend provider in production', () => {
    expect(() =>
      validateFn({
        ...baseConfig,
        NODE_ENV: 'production',
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_key',
        EMAIL_FROM: 'Canarinhos <no-reply@example.com>',
      }),
    ).not.toThrow();
  });
});
