import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AccessTokenDto, RequestCodeDto, VerifyCodeDto } from './types/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestCode(@Body() dto: RequestCodeDto): Promise<void> {
    await this.authService.requestCode(dto.email);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyCodeDto): Promise<AccessTokenDto> {
    return this.authService.verifyCode(dto.email, dto.code);
  }
}
