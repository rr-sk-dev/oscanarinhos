import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches } from 'class-validator';

const trimAndLowercase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RequestCodeDto {
  @Transform(trimAndLowercase)
  @IsEmail()
  email: string;
}

export class VerifyCodeDto {
  @Transform(trimAndLowercase)
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^\d{6}$/)
  code: string;
}

export class AccessTokenDto {
  accessToken: string;
}
