import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { MeService } from './me.service';
import { MeResponseDto } from './types/me.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    return this.meService.getMe(user.userId);
  }
}
