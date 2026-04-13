import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
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
}
