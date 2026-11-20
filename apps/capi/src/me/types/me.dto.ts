import { Type } from 'class-transformer';
import { IsDefined, IsNotEmpty, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';
import { MembershipRole } from '../../members/types/membership.entity';
import { IsPushEndpointHost } from './is-push-endpoint-host.validator';

export class MeResponseDto {
  user: { id: string; email: string; name: string | null };
  memberships: { teamId: string; teamName: string; role: MembershipRole; membershipId: string }[];
}

export class PushSubscriptionKeysDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  p256dh: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  auth: string;
}

export class RegisterPushSubscriptionDto {
  @IsUrl({ protocols: ['https'], require_protocol: true, require_tld: true })
  @IsPushEndpointHost()
  @MaxLength(2048)
  endpoint: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;
}

export class UnregisterPushSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  endpoint: string;
}
