import { Body, Controller, Delete, Get, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { MeService } from './me.service';
import { PushSubscriptionsService } from './push-subscriptions.service';
import {
  MeResponseDto,
  RegisterPushSubscriptionDto,
  UnregisterPushSubscriptionDto,
} from './types/me.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly pushSubscriptionsService: PushSubscriptionsService,
  ) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.meService.getMe(user.userId);
  }

  @Post('push-subscriptions')
  @HttpCode(204)
  registerPushSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterPushSubscriptionDto,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<void> {
    return this.pushSubscriptionsService.register(user.userId, dto, userAgent ?? null);
  }

  @Delete('push-subscriptions')
  @HttpCode(204)
  unregisterPushSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UnregisterPushSubscriptionDto,
  ): Promise<void> {
    return this.pushSubscriptionsService.unregister(user.userId, dto.endpoint);
  }
}
