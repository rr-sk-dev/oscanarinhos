import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { enumOf, ValueOf } from '../../utils/ts-utils';

export const Environment = enumOf({
  Development: 'development',
  Production: 'production',
});

export type Environment = ValueOf<typeof Environment>;

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
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  CORS_ORIGINS?: string[];

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
}

/**
 * Every key of EnvironmentVariables. Each one can alternatively be provided
 * through `${KEY}_FILE` (see env-files.ts).
 */
export const ENVIRONMENT_VARIABLE_KEYS = [
  'NODE_ENV',
  'PORT',
  'CORS_ORIGINS',
  'POSTGRES_URL',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_PUBLIC_URL',
  'R2_BUCKET_NAME',
  'YOUTUBE_API_KEY',
  'YOUTUBE_BASE_URL',
  'YOUTUBE_CHANNEL_HANDLE',
] as const satisfies readonly (keyof EnvironmentVariables)[];

// Compile-time guard: fails if a property is added to EnvironmentVariables but not listed above.
type MissingEnvKeys = Exclude<
  keyof EnvironmentVariables,
  (typeof ENVIRONMENT_VARIABLE_KEYS)[number]
>;
const allEnvKeysListed: [MissingEnvKeys] extends [never] ? true : MissingEnvKeys = true;
void allEnvKeysListed;
