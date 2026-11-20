import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, IsUrl, ValidateNested } from 'class-validator';
import { MembershipRole } from '../../members/types/membership.entity';

export class MeResponseDto {
  user: { id: string; email: string; name: string | null };
  memberships: { teamId: string; teamName: string; role: MembershipRole; membershipId: string }[];
}

export class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class RegisterPushSubscriptionDto {
  @IsUrl()
  endpoint: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class UnregisterPushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  endpoint: string;
}
