import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUrl,
  Max,
  MinLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { enumOf, ValueOf } from '../../utils/ts-utils';

export const Environment = enumOf({
  Development: 'development',
  Production: 'production',
});

export type Environment = ValueOf<typeof Environment>;

export const EmailProvider = enumOf({
  Console: 'console',
  Resend: 'resend',
});

export type EmailProvider = ValueOf<typeof EmailProvider>;

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(3000)
  @Max(3004)
  PORT: number;

  @Transform(
    ({ value }) =>
      value
        ?.split(',')
        .map((s: string) => s.trim())
        .filter(Boolean) ?? [],
  )
  @IsArray()
  @IsString({ each: true })
  CORS_ORIGINS: string[];

  @IsString()
  @IsNotEmpty()
  POSTGRES_URL: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCOUNT_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_ACCESS_KEY_ID: string;

  @IsString()
  @IsNotEmpty()
  R2_SECRET_ACCESS_KEY: string;

  @IsUrl()
  @IsNotEmpty()
  R2_PUBLIC_URL: string;

  @IsString()
  @IsNotEmpty()
  R2_BUCKET_NAME: string;

  @IsString()
  @IsNotEmpty()
  YOUTUBE_API_KEY: string;

  @IsUrl()
  @IsNotEmpty()
  YOUTUBE_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  YOUTUBE_CHANNEL_HANDLE: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsNotEmpty()
  JWT_EXPIRES_IN: string = '30d';

  @IsEnum(EmailProvider)
  EMAIL_PROVIDER: EmailProvider;

  @ValidateIf((env: EnvironmentVariables) => env.EMAIL_PROVIDER === EmailProvider.Resend)
  @IsString()
  @IsNotEmpty()
  RESEND_API_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.EMAIL_PROVIDER === EmailProvider.Resend)
  @IsString()
  @IsNotEmpty()
  EMAIL_FROM?: string;

  @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === Environment.Production)
  @IsString()
  @IsNotEmpty()
  VAPID_PUBLIC_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === Environment.Production)
  @IsString()
  @IsNotEmpty()
  VAPID_PRIVATE_KEY?: string;

  @ValidateIf((env: EnvironmentVariables) => env.NODE_ENV === Environment.Production)
  @IsString()
  @IsNotEmpty()
  VAPID_SUBJECT?: string;

  // Optional in development (an empty value counts as unset), but a value that is set must
  // still be a URL.
  @ValidateIf(
    (env: EnvironmentVariables) =>
      env.NODE_ENV === Environment.Production ||
      (env.FRONTEND_URL !== undefined && env.FRONTEND_URL !== ''),
  )
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  FRONTEND_URL?: string;
}
