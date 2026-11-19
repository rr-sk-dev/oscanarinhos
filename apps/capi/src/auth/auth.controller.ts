import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AccessTokenDto, RequestCodeDto, VerifyCodeDto } from './types/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('code')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestCode(@Body() dto: RequestCodeDto): Promise<void> {
    await this.authService.requestCode(dto.email);
  }

  @Post('verify')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyCodeDto): Promise<AccessTokenDto> {
    return this.authService.verifyCode(dto.email, dto.code);
  }
}
